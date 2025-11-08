import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { createFlightBooking } from "./booking.service";
import { BookingRequest } from "./booking.interface";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  // Detect supplier
  const supplier =
    req.body.supplier || (req.body.availabilityToken ? "ebooking" : "amadeus");

  const bookingRequest: BookingRequest = {
    supplier,

    // Common fields
    flightOffer: req.body.flightOffer,
    travelers: req.body.travelers,
    contactEmail: req.body.contactEmail,
    contactPhone: req.body.contactPhone,
    contactPhoneCountryCode: req.body.contactPhoneCountryCode,
    address: req.body.address,
    remarks: req.body.remarks,
    instantTicketing: req.body.instantTicketing,
    seatSelections: req.body.seatSelections,

    // ebooking specific fields
    clientRef: req.body.clientRef,
    availabilityToken: req.body.availabilityToken,
    OSIRemarks: req.body.OSIRemarks,
    seatRequests: req.body.seatRequests,
    frequentTravellerCards: req.body.frequentTravellerCards,
    backOfficeRemarks: req.body.backOfficeRemarks,
    comments: req.body.comments,
    priceModifiers: req.body.priceModifiers,

    // ebooking booking parameters (srk, offerIndex)
    ...(supplier === "ebooking" && {
      srk: req.body.srk,
      offerIndex: req.body.offerIndex,
    }),

    // Auth context (from middleware or request body)
    wholesalerId: (req as any).user?.wholesaler || req.body.wholesalerId,
    agencyId: (req as any).user?.agency || req.body.agencyId,
    subagentId: (req as any).user?.id || req.body.subagentId,

    // Metadata
    meta: req.body.meta,
  };

  const result = await createFlightBooking(bookingRequest);

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Flight booking created successfully via ${supplier}!`,
    data: result,
  });
});

export const BookingController = {
  createBooking,
};
