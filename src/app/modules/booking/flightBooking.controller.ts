import { Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import {
  createAndSaveFlightBooking,
  getFlightBookingById,
  getFlightBookingsByAgency,
} from "./flightBooking.service";
import { BookingRequest } from "./booking.interface";

/**
 * Create flight booking - Call Amadeus API and save to database
 * POST /api/v1/flight-booking/create
 */
const createFlightBooking = catchAsync(async (req: any, res: Response) => {
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

  // Extract agency and wholesaler from authenticated user token
  const agencyId = req.user?.agencyId;
  const wholesalerId = req.user?.wholesalerId;
  const subagentId = req.user?.userId;

  if (!agencyId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Agency authentication required",
      data: null,
    });
  }

  if (!wholesalerId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Wholesaler authentication required",
      data: null,
    });
  }

  // Fetch agency details to get slugs
  const Agency = mongoose.model("Agency");
  const agency = await Agency.findById(agencyId)
    .select("slug wholesaler")
    .populate("wholesaler", "slug")
    .lean();

  if (!agency) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Agency not found",
      data: null,
    });
  }

  const agencySlug = (agency as { slug?: string }).slug;
  const wholesalerSlug = (agency as { wholesaler?: { slug?: string } })
    .wholesaler?.slug;

  if (!agencySlug) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Agency slug not configured",
      data: null,
    });
  }

  if (!wholesalerSlug) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Wholesaler slug not configured",
      data: null,
    });
  }

  const result = await createAndSaveFlightBooking(
    bookingRequest,
    agencyId,
    agencySlug,
    wholesalerId,
    wholesalerSlug,
    subagentId
  );

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Flight booking created and saved successfully!",
    data: result,
  });
});

/**
 * Get flight booking by ID
 * GET /api/v1/flight-booking/:id
 */
const getFlightBooking = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;

  const result = await getFlightBookingById(id);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight booking retrieved successfully!",
    data: result,
  });
});

/**
 * Get all flight bookings for an agency
 * GET /api/v1/flight-booking/agency/:agencyId
 */
const getAgencyFlightBookings = catchAsync(
  async (req: any, res: Response) => {
    const { agencyId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getFlightBookingsByAgency(agencyId, page, limit);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Flight bookings retrieved successfully!",
      data: result.bookings,
      meta: result.pagination,
    });
  }
);

export const FlightBookingController = {
  createFlightBooking,
  getFlightBooking,
  getAgencyFlightBookings,
};
