import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import {
  createBlockSeat,
  getBlockSeatsByWholesaler,
  getBlockSeatById,
  searchBlockSeatsByRoute,
  getAllAvailableOrigins,
  getAvailableDestinations,
  getAvailableDatesForRoute,
  updateBlockSeat,
  softDeleteBlockSeat,
  CreateBlockSeatRequest,
  UpdateBlockSeatRequest,
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
      airlines,
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

    if (!airlines || !Array.isArray(airlines) || airlines.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "At least one airline is required",
        data: null,
      });
    }

    // Validate each airline
    for (const airlineItem of airlines) {
      if (!airlineItem.code || !airlineItem.name) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each airline must have code and name",
          data: null,
        });
      }
    }

    if (!route || !route.from || !route.to || !route.tripType) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Route information is required (from, to, tripType)",
        data: null,
      });
    }

    if (!route.flightType) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Flight type is required (DIRECT or STOPPAGE)",
        data: null,
      });
    }

    if (route.stops === undefined || route.stops < 0 || route.stops > 3) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Stops must be between 0 and 3",
        data: null,
      });
    }

    if (!route.outboundSegments || route.outboundSegments.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "At least one outbound segment is required",
        data: null,
      });
    }

    // Validate outbound segments count matches stops + 1
    if (route.outboundSegments.length !== route.stops + 1) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: `Outbound segments must be ${route.stops + 1} for ${
          route.stops
        } stop(s)`,
        data: null,
      });
    }

    // Validate return segments for ROUND_TRIP
    if (route.tripType === "ROUND_TRIP") {
      if (!route.returnSegments || route.returnSegments.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Return segments are required for ROUND_TRIP",
          data: null,
        });
      }

      if (route.returnSegments.length !== route.stops + 1) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: `Return segments must be ${route.stops + 1} for ${
            route.stops
          } stop(s)`,
          data: null,
        });
      }
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

    // Validate date structure
    for (const dateObj of availableDates) {
      if (!dateObj.departureDate) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each date must have a departureDate",
          data: null,
        });
      }

      if (!dateObj.deadline) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each date must have a booking deadline",
          data: null,
        });
      }

      if (
        !dateObj.outboundSegmentTimes ||
        !Array.isArray(dateObj.outboundSegmentTimes) ||
        dateObj.outboundSegmentTimes.length === 0
      ) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each date must have outbound segment times",
          data: null,
        });
      }

      // Validate outbound segment times count matches route segments
      if (
        dateObj.outboundSegmentTimes.length !== route.outboundSegments.length
      ) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: `Outbound segment times count must match outbound segments count (${route.outboundSegments.length})`,
          data: null,
        });
      }

      // Validate return date and return segment times for ROUND_TRIP
      if (route.tripType === "ROUND_TRIP") {
        if (!dateObj.returnDate) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Return date is required for ROUND_TRIP bookings",
            data: null,
          });
        }

        if (
          !dateObj.returnSegmentTimes ||
          !Array.isArray(dateObj.returnSegmentTimes) ||
          dateObj.returnSegmentTimes.length === 0
        ) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message:
              "Return segment times are required for ROUND_TRIP bookings",
            data: null,
          });
        }

        if (
          route.returnSegments &&
          dateObj.returnSegmentTimes.length !== route.returnSegments.length
        ) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: `Return segment times count must match return segments count (${route.returnSegments.length})`,
            data: null,
          });
        }
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
      if (!classItem.classId || !classItem.totalSeats) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each class must have classId and totalSeats",
          data: null,
        });
      }

      if (
        !classItem.pricing ||
        !classItem.pricing.adult ||
        !classItem.pricing.children ||
        !classItem.pricing.infant
      ) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message:
            "Each class must have pricing for adult, children, and infant",
          data: null,
        });
      }

      if (
        classItem.pricing.adult.price === undefined ||
        classItem.pricing.children.price === undefined ||
        classItem.pricing.infant.price === undefined
      ) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Each passenger type must have a price",
          data: null,
        });
      }
    }

    // Prepare request object
    const blockSeatRequest: CreateBlockSeatRequest = {
      name,
      airlines,
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
 * Get all available origins (FROM airports)
 * GET /api/v1/block-seats/origins
 */
const getAllOriginsController = catchAsync(async (req: any, res: Response) => {
  const { tripType, search } = req.query;

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

  // Get all available origins for this wholesaler
  const result = await getAllAvailableOrigins(
    wholesalerId,
    tripType as "ONE_WAY" | "ROUND_TRIP" | undefined,
    search as string | undefined
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Available origins retrieved successfully",
    data: result,
  });
});

/**
 * Get available destinations by origin airport
 * GET /api/v1/block-seats/destinations
 */
const getAvailableDestinationsController = catchAsync(
  async (req: any, res: Response) => {
    const { fromIata, tripType } = req.query;

    // Validate required parameters
    if (!fromIata) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "From IATA code is required",
        data: null,
      });
    }

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

    // Get available destinations for this wholesaler
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
    const { fromIata, toIata, tripType } = req.query;

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

    // Get available dates for route for this wholesaler
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

/**
 * Update block seat - Update an existing block seat (partial update supported)
 * PUT /api/v1/block-seats/:id
 */
const updateBlockSeatController = catchAsync(
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

    // Validate only fields that are being updated
    const {
      name,
      airlines,
      route,
      availableDates,
      removeDates,
      classes,
      currency,
      status,
      fareRules,
      baggageAllowance,
      commission,
      remarks,
      autoRelease,
      releaseDate,
    } = req.body;

    // If airlines is being updated, validate it
    if (airlines !== undefined) {
      if (!Array.isArray(airlines) || airlines.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "At least one airline is required",
          data: null,
        });
      }

      for (const airlineItem of airlines) {
        if (!airlineItem.code || !airlineItem.name) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each airline must have code and name",
            data: null,
          });
        }
      }
    }

    // If route is being updated, validate it
    if (route !== undefined) {
      if (!route.from || !route.to || !route.tripType) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Route information must include from, to, and tripType",
          data: null,
        });
      }

      if (!route.flightType) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Flight type is required (DIRECT or STOPPAGE)",
          data: null,
        });
      }

      if (route.stops === undefined || route.stops < 0 || route.stops > 3) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "Stops must be between 0 and 3",
          data: null,
        });
      }

      if (!route.outboundSegments || route.outboundSegments.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "At least one outbound segment is required",
          data: null,
        });
      }

      if (route.outboundSegments.length !== route.stops + 1) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: `Outbound segments must be ${route.stops + 1} for ${
            route.stops
          } stop(s)`,
          data: null,
        });
      }

      if (route.tripType === "ROUND_TRIP") {
        if (!route.returnSegments || route.returnSegments.length === 0) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Return segments are required for ROUND_TRIP",
            data: null,
          });
        }

        if (route.returnSegments.length !== route.stops + 1) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: `Return segments must be ${route.stops + 1} for ${
              route.stops
            } stop(s)`,
            data: null,
          });
        }
      }
    }

    // If availableDates is being updated, validate them
    if (availableDates !== undefined) {
      if (!Array.isArray(availableDates) || availableDates.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "At least one available date is required",
          data: null,
        });
      }

      // Validate date structure
      const tripType = route?.tripType || req.body.existingTripType;
      for (const dateObj of availableDates) {
        if (!dateObj.departureDate) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each date must have a departureDate",
            data: null,
          });
        }

        if (!dateObj.deadline) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each date must have a booking deadline",
            data: null,
          });
        }

        if (
          !dateObj.outboundSegmentTimes ||
          !Array.isArray(dateObj.outboundSegmentTimes) ||
          dateObj.outboundSegmentTimes.length === 0
        ) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each date must have outbound segment times",
            data: null,
          });
        }

        // Validate return date and return segment times for ROUND_TRIP
        if (tripType === "ROUND_TRIP") {
          if (!dateObj.returnDate) {
            return sendResponse(res, {
              statusCode: httpStatus.BAD_REQUEST,
              success: false,
              message: "Return date is required for ROUND_TRIP bookings",
              data: null,
            });
          }

          if (
            !dateObj.returnSegmentTimes ||
            !Array.isArray(dateObj.returnSegmentTimes) ||
            dateObj.returnSegmentTimes.length === 0
          ) {
            return sendResponse(res, {
              statusCode: httpStatus.BAD_REQUEST,
              success: false,
              message:
                "Return segment times are required for ROUND_TRIP bookings",
              data: null,
            });
          }
        }
      }
    }

    // If removeDates is provided, validate them
    if (removeDates !== undefined) {
      if (!Array.isArray(removeDates)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "removeDates must be an array",
          data: null,
        });
      }

      // Validate date structure for removal
      const tripType = route?.tripType || req.body.existingTripType;
      for (const dateObj of removeDates) {
        if (!dateObj.departureDate) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each date to remove must have a departureDate",
            data: null,
          });
        }

        // Validate return date for ROUND_TRIP
        if (tripType === "ROUND_TRIP" && !dateObj.returnDate) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message:
              "Return date is required for ROUND_TRIP bookings in removeDates",
            data: null,
          });
        }
      }
    }

    // If classes is being updated, validate them
    if (classes !== undefined) {
      if (!Array.isArray(classes) || classes.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: "At least one class is required",
          data: null,
        });
      }

      // Validate each class
      for (const classItem of classes) {
        if (!classItem.classId || !classItem.totalSeats) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each class must have classId and totalSeats",
            data: null,
          });
        }

        if (
          !classItem.pricing ||
          !classItem.pricing.adult ||
          !classItem.pricing.children ||
          !classItem.pricing.infant
        ) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message:
              "Each class must have pricing for adult, children, and infant",
            data: null,
          });
        }

        if (
          classItem.pricing.adult.price === undefined ||
          classItem.pricing.children.price === undefined ||
          classItem.pricing.infant.price === undefined
        ) {
          return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Each passenger type must have a price",
            data: null,
          });
        }
      }
    }

    // Prepare request object with only provided fields
    const blockSeatRequest: UpdateBlockSeatRequest = {
      name,
      airlines,
      route,
      availableDates,
      removeDates,
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

    // Update block seat
    const result = await updateBlockSeat(id, wholesalerId, blockSeatRequest);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Block seat updated successfully!",
      data: result.blockSeat,
    });
  }
);

/**
 * Delete block seat - Soft delete a block seat (set isDeleted to true)
 * DELETE /api/v1/block-seats/:id
 */
const deleteBlockSeatController = catchAsync(
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

    // Soft delete block seat
    const result = await softDeleteBlockSeat(id, wholesalerId);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

export const BlockSeatController = {
  createBlockSeat: createBlockSeatController,
  getBlockSeats: getBlockSeatsController,
  getBlockSeatById: getBlockSeatByIdController,
  searchBlockSeatsByRoute: searchBlockSeatsByRouteController,
  getAllOrigins: getAllOriginsController,
  getAvailableDestinations: getAvailableDestinationsController,
  getAvailableDates: getAvailableDatesController,
  updateBlockSeat: updateBlockSeatController,
  deleteBlockSeat: deleteBlockSeatController,
};
