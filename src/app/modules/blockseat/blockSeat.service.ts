import { BlockSeat } from "./blockSeat.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

// ==================== INTERFACES ====================
export interface AvailableDate {
  departureDate: string; // YYYY-MM-DD format
  returnDate?: string; // Optional, only for ROUND_TRIP
}

export interface CreateBlockSeatRequest {
  name: string;
  airline: {
    code: string;
    name: string;
    country?: string;
  };
  route: {
    from: {
      country: string;
      iataCode: string;
    };
    to: {
      country: string;
      iataCode: string;
    };
    tripType: "ONE_WAY" | "ROUND_TRIP";
  };
  availableDates: AvailableDate[];
  classes: Array<{
    classId: number;
    className?: string;
    totalSeats: number;
    price: number;
  }>;
  currency: string;
  status?: "Available" | "Unavailable";
  fareRules?: {
    template?:
      | "FLEXIBLE"
      | "SEMI_FLEXIBLE"
      | "STANDARD"
      | "RESTRICTED"
      | "NON_REFUNDABLE"
      | "MANUAL_ENTRY";
    refundable?: boolean;
    changeFee?: number;
    cancellationFee?: number;
  };
  baggageAllowance?: {
    checkedBags?: number;
    weightPerBag?: string;
    carryOnWeight?: string;
  };
  commission?: {
    supplierCommission?: {
      type: "FIXED_AMOUNT" | "PERCENTAGE";
      value: number;
    };
    agencyCommission?: {
      type: "FIXED_AMOUNT" | "PERCENTAGE";
      value: number;
    };
  };
  remarks?: string;
  autoRelease?: boolean;
  releaseDate?: Date;
}

// ==================== CREATE BLOCK SEAT ====================
export const createBlockSeat = async (
  request: CreateBlockSeatRequest,
  wholesalerId: string
): Promise<{ success: boolean; blockSeat: any }> => {
  try {
    // Validate required fields
    if (!request.name) {
      throw new AppError(httpStatus.BAD_REQUEST, "Block seat name is required");
    }

    // Validate classes
    if (!request.classes || request.classes.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "At least one class is required"
      );
    }

    // Validate available dates
    if (!request.availableDates || request.availableDates.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "At least one available date is required"
      );
    }

    // Validate dates based on trip type
    if (request.route.tripType === "ROUND_TRIP") {
      for (const dateObj of request.availableDates) {
        if (!dateObj.returnDate) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Return date is required for ROUND_TRIP bookings"
          );
        }
      }
    }

    // Create block seat document
    const blockSeat = await BlockSeat.create({
      // Basic info
      name: request.name,

      // Airline information
      airline: request.airline,

      // Route information
      route: request.route,

      // Available dates - keep original format
      availableDates: request.availableDates,

      // Classes with initial booking count as 0
      classes: request.classes.map((classItem) => ({
        classId: classItem.classId,
        className: classItem.className || `Class ${classItem.classId}`,
        totalSeats: classItem.totalSeats,
        bookedSeats: 0,
        availableSeats: classItem.totalSeats,
        price: classItem.price,
        currency: request.currency,
      })),

      // Currency
      currency: request.currency,

      // Fare rules
      fareRules: {
        template: request.fareRules?.template || "MANUAL_ENTRY",
        refundable: request.fareRules?.refundable || false,
        changeFee: request.fareRules?.changeFee || 0,
        cancellationFee: request.fareRules?.cancellationFee || 0,
      },

      // Baggage allowance
      baggageAllowance: {
        checkedBags: request.baggageAllowance?.checkedBags || 0,
        weightPerBag: request.baggageAllowance?.weightPerBag || "0kg",
        carryOnWeight: request.baggageAllowance?.carryOnWeight || "0kg",
      },

      // Commission
      commission: {
        supplierCommission: {
          type: request.commission?.supplierCommission?.type || "FIXED_AMOUNT",
          value: request.commission?.supplierCommission?.value || 0,
        },
        agencyCommission: {
          type: request.commission?.agencyCommission?.type || "FIXED_AMOUNT",
          value: request.commission?.agencyCommission?.value || 0,
        },
      },

      // Status
      status: request.status || "Available",

      // Wholesaler reference
      wholesaler: wholesalerId,

      // Additional information
      remarks: request.remarks,
      autoRelease: request.autoRelease || false,
      releaseDate: request.releaseDate,

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      blockSeat: blockSeat,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Failed to create block seat"
    );
  }
};

// ==================== GET BLOCK SEATS BY WHOLESALER ====================
export const getBlockSeatsByWholesaler = async (
  wholesalerId: string,
  page = 1,
  limit = 10
): Promise<{
  blockSeats: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  try {
    const skip = (page - 1) * limit;

    const [blockSeats, total] = await Promise.all([
      BlockSeat.find({ wholesaler: wholesalerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlockSeat.countDocuments({ wholesaler: wholesalerId }),
    ]);

    return {
      blockSeats: blockSeats,
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
      error instanceof Error ? error.message : "Failed to retrieve block seats"
    );
  }
};

// ==================== GET BLOCK SEAT BY ID ====================
export const getBlockSeatById = async (
  blockSeatId: string,
  wholesalerId: string
): Promise<any> => {
  try {
    const blockSeat = await BlockSeat.findOne({
      _id: blockSeatId,
      wholesaler: wholesalerId,
    }).lean();

    if (!blockSeat) {
      throw new AppError(httpStatus.NOT_FOUND, "Block seat not found");
    }

    return blockSeat;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Failed to retrieve block seat"
    );
  }
};
