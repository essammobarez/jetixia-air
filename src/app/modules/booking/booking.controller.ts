import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { createFlightBooking } from "./booking.service";
import { BookingRequest } from "./booking.interface";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingRequest: BookingRequest = {
    flightOffer: req.body.flightOffer,
    travelers: req.body.travelers,
    contactEmail: req.body.contactEmail,
    contactPhone: req.body.contactPhone,
    contactPhoneCountryCode: req.body.contactPhoneCountryCode,
    address: req.body.address,
    remarks: req.body.remarks,
    instantTicketing: req.body.instantTicketing,
    seatSelections: req.body.seatSelections,
  };

  const result = await createFlightBooking(bookingRequest);

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Flight booking created successfully!",
    data: result,
  });
});

export const BookingController = {
  createBooking,
};
