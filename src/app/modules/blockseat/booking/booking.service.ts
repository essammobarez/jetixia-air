import mongoose from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { BlockSeat } from "../blockSeat.model";
import { BlockSeatBooking, IBlockSeatBooking } from "./booking.model";

// Import models to ensure they're registered for populate
import "../../agency/agency.model";
import "../../wholesaler/wholesaler.model";

export interface CreateBookingRequest {
  reference?: string;
  blockSeatId: string;
  agencyId?: string; // Optional - can be extracted from req.user
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (required if block seat is ROUND_TRIP)
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

    // Get trip type from block seat
    const tripType = blockSeat.route.tripType;

    // Validate date availability
    const dateExists = blockSeat.availableDates.some((d: any) => {
      if (tripType === "ONE_WAY")
        return d.departureDate === payload.departureDate;
      return (
        d.departureDate === payload.departureDate &&
        d.returnDate === payload.returnDate
      );
    });
    if (!dateExists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected date is not available for this block seat"
      );
    }

    // Validate return date for ROUND_TRIP
    if (tripType === "ROUND_TRIP" && !payload.returnDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Return date is required for ROUND_TRIP bookings"
      );
    }

    // Auto-select first available class with enough seats (starting from classId 1)
    const sortedClasses = [...blockSeat.classes].sort(
      (a: any, b: any) => a.classId - b.classId
    );
    const availableClass = sortedClasses.find(
      (c: any) => c.availableSeats >= quantity
    );

    if (!availableClass) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No available class with sufficient seats"
      );
    }

    const selectedClassId = availableClass.classId;

    // Atomic update: deduct seats with arrayFilters
    const updateRes = await BlockSeat.updateOne(
      {
        _id: blockSeat._id,
        "classes.classId": selectedClassId,
        isDeleted: { $ne: true },
      },
      {
        $inc: {
          "classes.$[ci].availableSeats": -quantity,
          "classes.$[ci].bookedSeats": quantity,
        },
      },
      { arrayFilters: [{ "ci.classId": selectedClassId }], session }
    );

    if (updateRes.modifiedCount !== 1) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Failed to reserve seats. Please try again."
      );
    }

    // Calculate pricing breakdown by passenger type
    const adultCount = payload.passengers.filter(
      (p) => p.paxType === "ADT"
    ).length;
    const childCount = payload.passengers.filter(
      (p) => p.paxType === "CHD"
    ).length;
    const infantCount = payload.passengers.filter(
      (p) => p.paxType === "INF"
    ).length;

    const adultPrice = availableClass.pricing.adult.price;
    const childPrice = availableClass.pricing.children.price;
    const infantPrice = availableClass.pricing.infant.price;

    const totalAmount =
      adultCount * adultPrice +
      childCount * childPrice +
      infantCount * infantPrice;

    const breakdown = [];
    if (adultCount > 0)
      breakdown.push({
        paxType: "ADT",
        count: adultCount,
        unit: adultPrice,
        subtotal: adultCount * adultPrice,
      });
    if (childCount > 0)
      breakdown.push({
        paxType: "CHD",
        count: childCount,
        unit: childPrice,
        subtotal: childCount * childPrice,
      });
    if (infantCount > 0)
      breakdown.push({
        paxType: "INF",
        count: infantCount,
        unit: infantPrice,
        subtotal: infantCount * infantPrice,
      });

    const booking = await BlockSeatBooking.create(
      [
        {
          reference: payload.reference,
          blockSeat: blockSeat._id,
          agency: payload.agencyId,
          wholesaler: (blockSeat as any).wholesaler,
          classId: selectedClassId,
          trip: {
            tripType: tripType,
            departureDate: payload.departureDate,
            returnDate: payload.returnDate,
          },
          passengers: payload.passengers,
          contact: payload.contact,
          quantity,
          priceSnapshot: {
            currency: blockSeat.currency,
            unitPrice: adultPrice, // Use adult price as reference
            totalAmount: totalAmount,
            breakdown: breakdown,
            commissions: {
              supplier: blockSeat.commission?.supplierCommission,
              agency: availableClass.pricing.adult.commission, // Use adult commission as primary
            },
          },
          status: "CONFIRMED",
          notes: payload.notes,
          audit: [
            {
              at: new Date(),
              by: userId as any,
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
    .populate({
      path: "blockSeat",
      select: "name airlines route currency classes",
    })
    .populate({
      path: "wholesaler",
      select: "wholesalerName email phoneNumber address logo",
    })
    .populate({ path: "agency", select: "name email phone" })
    .lean();
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  return booking;
};

export const getBookingsByWholesaler = async (
  wholesalerId: string,
  page = 1,
  limit = 10,
  status?: "PENDING" | "CONFIRMED" | "CANCELLED"
) => {
  try {
    const skip = (page - 1) * limit;

    const query: any = { wholesaler: wholesalerId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      BlockSeatBooking.find(query)
        .populate({
          path: "blockSeat",
          select: "name airlines route currency classes",
        })
        .populate({ path: "agency", select: "name email phone" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlockSeatBooking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Failed to retrieve bookings"
    );
  }
};

export const getBookingsByAgency = async (
  agencyId: string,
  page = 1,
  limit = 10,
  status?: "PENDING" | "CONFIRMED" | "CANCELLED"
) => {
  try {
    const skip = (page - 1) * limit;

    const query: any = { agency: agencyId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      BlockSeatBooking.find(query)
        .populate({
          path: "blockSeat",
          select: "name airlines route currency classes",
        })
        .populate({
          path: "wholesaler",
          select: "wholesalerName email phoneNumber address logo",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlockSeatBooking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to retrieve agency bookings"
    );
  }
};

export const updateBookingStatus = async (
  id: string,
  status: "CONFIRMED" | "CANCELLED",
  pnr?: string,
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

    // Set PNR if provided and status is CONFIRMED
    if (status === "CONFIRMED" && pnr) {
      booking.pnr = pnr;
    }

    booking.audit = booking.audit || [];
    booking.audit.push({
      at: new Date(),
      by: userId as any,
      action: `STATUS_${status}`,
      meta: pnr ? { pnr } : undefined,
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
