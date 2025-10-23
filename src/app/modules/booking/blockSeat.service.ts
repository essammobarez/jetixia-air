import { BlockSeat } from "../blockseat/blockSeat.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

// ==================== INTERFACES ====================
export interface CreateBlockSeatRequest {
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
  availableDates: string[]; // YYYY-MM-DD format
  classes: Array<{
    classId: number;
    className: string;
    totalSeats: number;
    price: number;
  }>;
  currency: string;
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

export interface BlockSeatResponse {
  _id: string;
  blockSeatId: string;
  sequenceNumber: number;
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
    tripType: string;
  };
  availableDates: string[];
  classes: Array<{
    classId: number;
    className: string;
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
    price: number;
    currency: string;
  }>;
  currency: string;
  fareRules: {
    template: string;
    refundable: boolean;
    changeFee: number;
    cancellationFee: number;
  };
  baggageAllowance: {
    checkedBags: number;
    weightPerBag: string;
    carryOnWeight: string;
  };
  commission: {
    supplierCommission: {
      type: string;
      value: number;
    };
    agencyCommission: {
      type: string;
      value: number;
    };
  };
  status: string;
  remarks?: string;
  autoRelease: boolean;
  releaseDate?: Date;
  totalSeats: number;
  totalBookedSeats: number;
  totalAvailableSeats: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CREATE BLOCK SEAT ====================
export const createBlockSeat = async (
  request: CreateBlockSeatRequest,
  wholesalerId: string
): Promise<{ success: boolean; blockSeat: BlockSeatResponse }> => {
  try {
    // Generate block seat ID
    const { blockSeatId, sequenceNumber } =
      await BlockSeat.generateBlockSeatId();

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

    // Create block seat document
    const blockSeat = await BlockSeat.create({
      // Identifiers
      blockSeatId,
      sequenceNumber,

      // Airline information
      airline: request.airline,

      // Route information
      route: request.route,

      // Available dates
      availableDates: request.availableDates,

      // Classes with initial booking count as 0
      classes: request.classes.map((classItem) => ({
        classId: classItem.classId,
        className: classItem.className,
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
      status: "ACTIVE",

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

    // Get the created block seat with calculated fields
    const createdBlockSeat = await BlockSeat.findById(blockSeat._id).lean();

    if (!createdBlockSeat) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to retrieve created block seat"
      );
    }

    // Calculate summary fields
    const totalSeats = createdBlockSeat.classes.reduce(
      (total, classItem) => total + classItem.totalSeats,
      0
    );
    const totalBookedSeats = createdBlockSeat.classes.reduce(
      (total, classItem) => total + classItem.bookedSeats,
      0
    );
    const totalAvailableSeats = createdBlockSeat.classes.reduce(
      (total, classItem) => total + classItem.availableSeats,
      0
    );
    const totalRevenue = createdBlockSeat.classes.reduce(
      (total, classItem) => total + classItem.bookedSeats * classItem.price,
      0
    );

    const response: BlockSeatResponse = {
      _id: createdBlockSeat._id.toString(),
      blockSeatId: createdBlockSeat.blockSeatId,
      sequenceNumber: createdBlockSeat.sequenceNumber,
      airline: createdBlockSeat.airline,
      route: createdBlockSeat.route,
      availableDates: createdBlockSeat.availableDates,
      classes: createdBlockSeat.classes,
      currency: createdBlockSeat.currency,
      fareRules: createdBlockSeat.fareRules,
      baggageAllowance: createdBlockSeat.baggageAllowance,
      commission: createdBlockSeat.commission,
      status: createdBlockSeat.status,
      remarks: createdBlockSeat.remarks,
      autoRelease: createdBlockSeat.autoRelease,
      releaseDate: createdBlockSeat.releaseDate,
      totalSeats,
      totalBookedSeats,
      totalAvailableSeats,
      totalRevenue,
      createdAt: createdBlockSeat.createdAt,
      updatedAt: createdBlockSeat.updatedAt,
    };

    return {
      success: true,
      blockSeat: response,
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
  blockSeats: BlockSeatResponse[];
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
      BlockSeat.findByWholesaler(wholesalerId, page, limit),
      BlockSeat.countDocuments({ wholesaler: wholesalerId }),
    ]);

    // Transform block seats with calculated fields
    const transformedBlockSeats: BlockSeatResponse[] = blockSeats.map(
      (blockSeat) => {
        const totalSeats = blockSeat.classes.reduce(
          (total, classItem) => total + classItem.totalSeats,
          0
        );
        const totalBookedSeats = blockSeat.classes.reduce(
          (total, classItem) => total + classItem.bookedSeats,
          0
        );
        const totalAvailableSeats = blockSeat.classes.reduce(
          (total, classItem) => total + classItem.availableSeats,
          0
        );
        const totalRevenue = blockSeat.classes.reduce(
          (total, classItem) => total + classItem.bookedSeats * classItem.price,
          0
        );

        return {
          _id: blockSeat._id.toString(),
          blockSeatId: blockSeat.blockSeatId,
          sequenceNumber: blockSeat.sequenceNumber,
          airline: blockSeat.airline,
          route: blockSeat.route,
          availableDates: blockSeat.availableDates,
          classes: blockSeat.classes,
          currency: blockSeat.currency,
          fareRules: blockSeat.fareRules,
          baggageAllowance: blockSeat.baggageAllowance,
          commission: blockSeat.commission,
          status: blockSeat.status,
          remarks: blockSeat.remarks,
          autoRelease: blockSeat.autoRelease,
          releaseDate: blockSeat.releaseDate,
          totalSeats,
          totalBookedSeats,
          totalAvailableSeats,
          totalRevenue,
          createdAt: blockSeat.createdAt,
          updatedAt: blockSeat.updatedAt,
        };
      }
    );

    return {
      blockSeats: transformedBlockSeats,
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
): Promise<BlockSeatResponse> => {
  try {
    const blockSeat = await BlockSeat.findOne({
      blockSeatId,
      wholesaler: wholesalerId,
    }).lean();

    if (!blockSeat) {
      throw new AppError(httpStatus.NOT_FOUND, "Block seat not found");
    }

    // Calculate summary fields
    const totalSeats = blockSeat.classes.reduce(
      (total, classItem) => total + classItem.totalSeats,
      0
    );
    const totalBookedSeats = blockSeat.classes.reduce(
      (total, classItem) => total + classItem.bookedSeats,
      0
    );
    const totalAvailableSeats = blockSeat.classes.reduce(
      (total, classItem) => total + classItem.availableSeats,
      0
    );
    const totalRevenue = blockSeat.classes.reduce(
      (total, classItem) => total + classItem.bookedSeats * classItem.price,
      0
    );

    const response: BlockSeatResponse = {
      _id: blockSeat._id.toString(),
      blockSeatId: blockSeat.blockSeatId,
      sequenceNumber: blockSeat.sequenceNumber,
      airline: blockSeat.airline,
      route: blockSeat.route,
      availableDates: blockSeat.availableDates,
      classes: blockSeat.classes,
      currency: blockSeat.currency,
      fareRules: blockSeat.fareRules,
      baggageAllowance: blockSeat.baggageAllowance,
      commission: blockSeat.commission,
      status: blockSeat.status,
      remarks: blockSeat.remarks,
      autoRelease: blockSeat.autoRelease,
      releaseDate: blockSeat.releaseDate,
      totalSeats,
      totalBookedSeats,
      totalAvailableSeats,
      totalRevenue,
      createdAt: blockSeat.createdAt,
      updatedAt: blockSeat.updatedAt,
    };

    return response;
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
