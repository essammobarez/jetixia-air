import mongoose from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { BlockSeat } from "../blockSeat.model";
import { BlockSeatBooking, IBlockSeatBooking } from "./booking.model";

export interface CreateBookingRequest {
  reference?: string;
  blockSeatId: string;
  agencyId: string;
  classId: number;
  trip: {
    tripType: "ONE_WAY" | "ROUND_TRIP";
    departureDate: string;
    returnDate?: string;
  };
  passengers: Array<{
    paxType: "ADT" | "CHD" | "INF";
    title: string;
    firstName: string;
    lastName: string;
    gender?: "M" | "F";
    dob: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportIssueCountry?: string;
  }>;
  contact: {
    name: string;
    email: string;
    phoneCode?: string;
    phoneNumber: string;
  };
  notes?: string;
}

export const createBooking = async (
  payload: CreateBookingRequest,
  userId?: string
): Promise<IBlockSeatBooking> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Generate reference if not provided
    const generateRef = async (): Promise<string> => {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const d = new Date();
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      return `BS-${y}${m}${day}-${rand}`;
    };

    if (!payload.reference) {
      // attempt few times to avoid rare collision
      let attempts = 0;
      while (attempts < 3) {
        const ref = await generateRef();
        const exists = await BlockSeatBooking.exists({
          reference: ref,
        }).session(session);
        if (!exists) {
          payload.reference = ref;
          break;
        }
        attempts += 1;
      }
      if (!payload.reference) {
        // last resort
        payload.reference = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;
      }
    }
    const quantity = payload.passengers.length;

    const blockSeat = await BlockSeat.findOne({
      _id: payload.blockSeatId,
      status: "Available",
      isDeleted: { $ne: true },
    }).session(session);

    if (!blockSeat) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Block seat not found or unavailable"
      );
    }

    // Validate date availability
    const tripType = payload.trip.tripType;
    const dateExists = blockSeat.availableDates.some((d: any) => {
      if (tripType === "ONE_WAY")
        return d.departureDate === payload.trip.departureDate;
      return (
        d.departureDate === payload.trip.departureDate &&
        d.returnDate === payload.trip.returnDate
      );
    });
    if (!dateExists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected date is not available for this block seat"
      );
    }

    // Find class and ensure enough seats
    const cls = blockSeat.classes.find(
      (c: any) => c.classId === payload.classId
    );
    if (!cls) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected class is not available"
      );
    }
    if (cls.availableSeats < quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Insufficient available seats for selected class"
      );
    }

    // Atomic update: deduct seats with arrayFilters
    const updateRes = await BlockSeat.updateOne(
      {
        _id: blockSeat._id,
        "classes.classId": payload.classId,
        isDeleted: { $ne: true },
      },
      {
        $inc: {
          "classes.$[ci].availableSeats": -quantity,
          "classes.$[ci].bookedSeats": quantity,
        },
      },
      { arrayFilters: [{ "ci.classId": payload.classId }], session }
    );

    if (updateRes.modifiedCount !== 1) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Failed to reserve seats. Please try again."
      );
    }

    const booking = await BlockSeatBooking.create(
      [
        {
          reference: payload.reference,
          blockSeat: blockSeat._id,
          agency: payload.agencyId,
          wholesaler: (blockSeat as any).wholesaler,
          classId: payload.classId,
          trip: payload.trip,
          passengers: payload.passengers,
          contact: payload.contact,
          quantity,
          priceSnapshot: {
            currency: blockSeat.currency,
            unitPrice: cls.price,
            totalAmount: cls.price * quantity,
            commissions: blockSeat.commission,
          },
          status: "CONFIRMED",
          notes: payload.notes,
          audit: [
            {
              at: new Date(),
              by: userId ? new mongoose.Types.ObjectId(userId) : undefined,
              action: "BOOK",
            },
          ],
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return booking[0];
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

export const getBookingById = async (id: string) => {
  const booking = await BlockSeatBooking.findById(id)
    .populate({ path: "blockSeat", select: "name airline route currency" })
    .lean();
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  return booking;
};

export const updateBookingStatus = async (
  id: string,
  status: "CONFIRMED" | "CANCELLED",
  userId?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await BlockSeatBooking.findById(id).session(session);
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");

    if (booking.status === status) return booking.toObject();

    // If cancelling, release seats back
    if (status === "CANCELLED" && booking.status === "CONFIRMED") {
      const incQty = booking.quantity;
      const upd = await BlockSeat.updateOne(
        {
          _id: booking.blockSeat,
          "classes.classId": booking.classId,
          isDeleted: { $ne: true },
        },
        {
          $inc: {
            "classes.$[ci].availableSeats": incQty,
            "classes.$[ci].bookedSeats": -incQty,
          },
        },
        { arrayFilters: [{ "ci.classId": booking.classId }], session }
      );
      if (upd.modifiedCount !== 1) {
        throw new AppError(httpStatus.CONFLICT, "Failed to release seats");
      }
    }

    booking.status = status;
    booking.audit = booking.audit || [];
    booking.audit.push({
      at: new Date(),
      by: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: `STATUS_${status}`,
    });
    await booking.save({ session });
    await session.commitTransaction();
    return booking.toObject();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};
