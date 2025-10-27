import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import {
  createBlockSeat,
  getBlockSeatsByWholesaler,
  getBlockSeatById,
  searchBlockSeatsByRoute,
  getAvailableDestinations,
  getAvailableDatesForRoute,
  CreateBlockSeatRequest,
} from "./blockSeat.service";

/**
 * Create block seat - Create a new block seat inventory
 * POST /api/v1/block-seats
 */
const createBlockSeatController = catchAsync(
  async (req: any, res: Response) => {
    // Extract wholesaler ID from authenticated user
    const wholesalerId = req.user?.wholesalerId;

    if (!wholesalerId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "Wholesaler authentication required",
        data: null,
      });
    }

    // Validate required fields
    const {
      name,
      airline,
      route,
      availableDates,
      classes,
      currency = "USD",
      status = "Available",
      fareRules,
      baggageAllowance,
      commission,
      remarks,
      autoRelease,
      releaseDate,
    } = req.body;

    if (!name) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Block seat name is required",
        data: null,
      });
    }

    if (!airline || !airline.code || !airline.name) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Airline information is required (code and name)",
        data: null,
      });
    }

    if (!route || !route.from || !route.to || !route.tripType) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Route information is required (from, to, tripType)",
        data: null,
      });
    }

    if (
      !availableDates ||
      !Array.isArray(availableDates) ||
      availableDates.length === 0
    ) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "At least one available date is required",
        data: null,
      });
    }

    // Validate date structure - back to object array format
    for (const dateObj of availableDates) {
      if (!dateObj.departureDate) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each date must have a departureDate",
          data: null,
        });
      }

      // Validate return date for ROUND_TRIP
      if (route.tripType === "ROUND_TRIP" && !dateObj.returnDate) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Return date is required for ROUND_TRIP bookings",
          data: null,
        });
      }
    }

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "At least one class is required",
        data: null,
      });
    }

    // Validate each class
    for (const classItem of classes) {
      if (
        !classItem.classId ||
        !classItem.totalSeats ||
        classItem.price === undefined
      ) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each class must have classId, totalSeats, and price",
          data: null,
        });
      }
    }

    // Prepare request object
    const blockSeatRequest: CreateBlockSeatRequest = {
      name,
      airline,
      route,
      availableDates,
      classes,
      currency,
      status,
      fareRules,
      baggageAllowance,
      commission,
      remarks,
      autoRelease,
      releaseDate,
    };

    // Create block seat
    const result = await createBlockSeat(blockSeatRequest, wholesalerId);

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Block seat created successfully!",
      data: result.blockSeat,
    });
  }
);

/**
 * Get block seats by wholesaler - Get all block seats for authenticated wholesaler
 * GET /api/v1/block-seats
 */
const getBlockSeatsController = catchAsync(async (req: any, res: Response) => {
  // Extract wholesaler ID from authenticated user
  const wholesalerId = req.user?.wholesalerId;

  if (!wholesalerId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Wholesaler authentication required",
      data: null,
    });
  }

  // Get pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Get block seats
  const result = await getBlockSeatsByWholesaler(wholesalerId, page, limit);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Block seats retrieved successfully!",
    data: result.blockSeats,
    meta: result.pagination,
  });
});

/**
 * Get block seat by ID - Get specific block seat for authenticated wholesaler
 * GET /api/v1/block-seats/:id
 */
const getBlockSeatByIdController = catchAsync(
  async (req: any, res: Response) => {
    // Extract wholesaler ID from authenticated user
    const wholesalerId = req.user?.wholesalerId;

    if (!wholesalerId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "Wholesaler authentication required",
        data: null,
      });
    }

    const { id } = req.params;

    if (!id) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Block seat ID is required",
        data: null,
      });
    }

    // Get block seat
    const result = await getBlockSeatById(id, wholesalerId);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Block seat retrieved successfully!",
      data: result,
    });
  }
);

/**
 * Search block seats by route and trip type
 * GET /api/v1/block-seats/search/route
 */
const searchBlockSeatsByRouteController = catchAsync(
  async (req: any, res: Response) => {
    const { fromIata, toIata, tripType } = req.query;
    const wholesalerId = req.user?.wholesalerId;
    // Validate required parameters
    if (!fromIata || !toIata) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "From IATA code and To IATA code are required",
        data: null,
      });
    }

    if (!tripType || !["ONE_WAY", "ROUND_TRIP"].includes(tripType)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Trip type must be either ONE_WAY or ROUND_TRIP",
        data: null,
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Search block seats with optional wholesaler filter
    const result = await searchBlockSeatsByRoute(
      fromIata,
      toIata,
      tripType as "ONE_WAY" | "ROUND_TRIP",
      page,
      limit,
      wholesalerId
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Block seats found successfully!",
      data: result.blockSeats,
      meta: result.pagination,
    });
  }
);

/**
 * Get available destinations by origin airport
 * GET /api/v1/block-seats/destinations
 */
const getAvailableDestinationsController = catchAsync(
  async (req: any, res: Response) => {
    const { fromIata, tripType, wholesalerId } = req.query;

    // Validate required parameters
    if (!fromIata) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "From IATA code is required",
        data: null,
      });
    }

    // Get available destinations
    const result = await getAvailableDestinations(
      fromIata,
      tripType as "ONE_WAY" | "ROUND_TRIP" | undefined,
      wholesalerId
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available destinations retrieved successfully!",
      data: result,
    });
  }
);

/**
 * Get available dates for specific route
 * GET /api/v1/block-seats/dates
 */
const getAvailableDatesController = catchAsync(
  async (req: any, res: Response) => {
    const { fromIata, toIata, tripType, wholesalerId } = req.query;

    // Validate required parameters
    if (!fromIata || !toIata) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "From IATA code and To IATA code are required",
        data: null,
      });
    }

    if (!tripType || !["ONE_WAY", "ROUND_TRIP"].includes(tripType)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Trip type must be either ONE_WAY or ROUND_TRIP",
        data: null,
      });
    }

    // Get available dates for route
    const result = await getAvailableDatesForRoute(
      fromIata,
      toIata,
      tripType as "ONE_WAY" | "ROUND_TRIP",
      wholesalerId
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available dates retrieved successfully!",
      data: result,
    });
  }
);

export const BlockSeatController = {
  createBlockSeat: createBlockSeatController,
  getBlockSeats: getBlockSeatsController,
  getBlockSeatById: getBlockSeatByIdController,
  searchBlockSeatsByRoute: searchBlockSeatsByRouteController,
  getAvailableDestinations: getAvailableDestinationsController,
  getAvailableDates: getAvailableDatesController,
};
