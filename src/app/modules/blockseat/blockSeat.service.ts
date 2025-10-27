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

// ==================== SEARCH BLOCK SEATS BY ROUTE ====================
export const searchBlockSeatsByRoute = async (
  fromIata: string,
  toIata: string,
  tripType: "ONE_WAY" | "ROUND_TRIP",
  page = 1,
  limit = 10,
  wholesalerId?: string
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

    // Build search query
    const searchQuery: any = {
      status: "Available",
      "route.tripType": tripType,
    };

    // Search for exact route match
    searchQuery["route.from.iataCode"] = fromIata.toUpperCase();
    searchQuery["route.to.iataCode"] = toIata.toUpperCase();

    // Filter by wholesaler if provided
    if (wholesalerId) {
      searchQuery.wholesaler = wholesalerId;
    }

    // Count total matching documents
    const total = await BlockSeat.countDocuments(searchQuery);

    // Get paginated results
    const blockSeats = await BlockSeat.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

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
      error instanceof Error ? error.message : "Failed to search block seats"
    );
  }
};

// ==================== GET AVAILABLE DESTINATIONS BY ORIGIN ====================
export const getAvailableDestinations = async (
  fromIata: string,
  tripType?: "ONE_WAY" | "ROUND_TRIP",
  wholesalerId?: string
): Promise<{
  fromAirport: {
    iataCode: string;
    country: string;
  } | null;
  destinations: Array<{
    toAirport: {
      iataCode: string;
      country: string;
    };
    tripType: string;
    classCount: number;
  }>;
}> => {
  try {
    // Build search query
    const searchQuery: any = {
      status: "Available",
      "route.from.iataCode": fromIata.toUpperCase(),
    };

    // Filter by trip type if provided
    if (tripType) {
      searchQuery["route.tripType"] = tripType;
    }

    // Filter by wholesaler if provided
    if (wholesalerId) {
      searchQuery.wholesaler = wholesalerId;
    }

    // Get all matching block seats
    const blockSeats = await BlockSeat.find(searchQuery).lean();

    if (!blockSeats || blockSeats.length === 0) {
      return {
        fromAirport: null,
        destinations: [],
      };
    }

    // Get unique from airport info from first result
    const fromAirport = blockSeats[0]?.route?.from || null;

    // Group by destination
    const destinationMap = new Map<string, any>();

    blockSeats.forEach((blockSeat: any) => {
      const toIata = blockSeat.route.to.iataCode;
      const key = `${toIata}-${blockSeat.route.tripType}`;

      if (!destinationMap.has(key)) {
        destinationMap.set(key, {
          toAirport: blockSeat.route.to,
          tripType: blockSeat.route.tripType,
          classCount: blockSeat.classes?.length || 0,
        });
      } else {
        const existing = destinationMap.get(key);
        existing.classCount += blockSeat.classes?.length || 0;
      }
    });

    const destinations = Array.from(destinationMap.values());

    return {
      fromAirport,
      destinations,
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to get available destinations"
    );
  }
};

// ==================== GET AVAILABLE DATES FOR SPECIFIC ROUTE ====================
export const getAvailableDatesForRoute = async (
  fromIata: string,
  toIata: string,
  tripType: "ONE_WAY" | "ROUND_TRIP",
  wholesalerId?: string
): Promise<{
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
  availableDates: Array<{
    departureDate: string;
    returnDate?: string;
  }>;
}> => {
  try {
    // Build search query
    const searchQuery: any = {
      status: "Available",
      "route.from.iataCode": fromIata.toUpperCase(),
      "route.to.iataCode": toIata.toUpperCase(),
      "route.tripType": tripType,
    };

    // Filter by wholesaler if provided
    if (wholesalerId) {
      searchQuery.wholesaler = wholesalerId;
    }

    // Get all matching block seats
    const blockSeats = await BlockSeat.find(searchQuery).lean();

    if (!blockSeats || blockSeats.length === 0) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No block seats found for this route"
      );
    }

    // Get route info from first result
    const route = blockSeats[0].route;

    // Collect all unique available dates
    const dateMap = new Map<string, any>();

    blockSeats.forEach((blockSeat: any) => {
      blockSeat.availableDates?.forEach((dateObj: any) => {
        if (tripType === "ONE_WAY") {
          const key = dateObj.departureDate;
          if (!dateMap.has(key)) {
            dateMap.set(key, { departureDate: dateObj.departureDate });
          }
        } else {
          const fullKey = `${dateObj.departureDate}-${dateObj.returnDate}`;
          if (!dateMap.has(fullKey)) {
            dateMap.set(fullKey, {
              departureDate: dateObj.departureDate,
              returnDate: dateObj.returnDate,
            });
          }
        }
      });
    });

    const availableDates = Array.from(dateMap.values());

    return {
      route,
      availableDates,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Failed to get available dates"
    );
  }
};
