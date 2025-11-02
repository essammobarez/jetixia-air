import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import {
  createBooking,
  getBookingById,
  getBookingsByWholesaler,
  updateBookingStatus,
  CreateBookingRequest,
} from "./booking.service";

const createBookingController = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const payload: CreateBookingRequest = req.body;

  // Extract agencyId from authenticated user
  const agencyId = req.user?.agencyId || req.user?.agency;

  if (!agencyId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Agency authentication required. User must belong to an agency.",
      data: null,
    });
  }

  // Override agencyId from request body with authenticated user's agencyId
  payload.agencyId = agencyId;

  // quantity = passengers.length must be >=1
  if (
    !payload.passengers ||
    !Array.isArray(payload.passengers) ||
    payload.passengers.length < 1
  ) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "At least one passenger is required",
      data: null,
    });
  }

  const booking = await createBooking(payload, userId);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Booking confirmed",
    data: booking,
  });
});

const getBookingController = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const booking = await getBookingById(id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking retrieved successfully",
    data: booking,
  });
});

const getBookingsByWholesalerController = catchAsync(
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

    // Get pagination and filter parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as
      | "PENDING"
      | "CONFIRMED"
      | "CANCELLED"
      | undefined;

    // Validate status if provided
    if (status && !["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Status must be PENDING, CONFIRMED, or CANCELLED",
        data: null,
      });
    }

    // Get bookings
    const result = await getBookingsByWholesaler(
      wholesalerId,
      page,
      limit,
      status
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data: result.bookings,
      meta: result.pagination,
    });
  }
);

const updateStatusController = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: "CONFIRMED" | "CANCELLED" };
  if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Status must be CONFIRMED or CANCELLED",
      data: null,
    });
  }
  const userId = req.user?.userId;
  const booking = await updateBookingStatus(id, status, userId);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking status updated",
    data: booking,
  });
});

export const BlockSeatBookingController = {
  createBooking: createBookingController,
  getBooking: getBookingController,
  getBookingsByWholesaler: getBookingsByWholesalerController,
  updateStatus: updateStatusController,
};
