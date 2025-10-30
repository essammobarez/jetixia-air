import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import {
  createBooking,
  getBookingById,
  updateBookingStatus,
  CreateBookingRequest,
} from "./booking.service";

const createBookingController = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?._id;
  const payload: CreateBookingRequest = req.body;

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
  const userId = req.user?._id;
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
  updateStatus: updateStatusController,
};
