import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { getFlightOfferPricing } from "./pricing.service";
import { FlightOfferPricingRequest } from "./pricing.interface";
import { mockPricingConfirmationData } from "./pricing.test";

const confirmFlightPricing = catchAsync(async (req: Request, res: Response) => {
  const request: FlightOfferPricingRequest = {
    supplier: req.body.supplier || (req.body.srk ? "ebooking" : "amadeus"),
    flightOffers: req.body.flightOffers,
    // ebooking specific
    srk: req.body.srk,
    offerIndex: req.body.offerIndex,
    itineraryIndex: req.body.itineraryIndex,
    token: req.body.token,
  };

  const result = await getFlightOfferPricing(request);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight pricing confirmed successfully!",
    data: result, // Result already includes unified response, raw data, and supplier
  });
});

const getTestPricingData = catchAsync(async (req: Request, res: Response) => {
  // Return static test data for frontend development and testing
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight pricing confirmed successfully!",
    data: mockPricingConfirmationData,
  });
});

export const PricingController = {
  confirmFlightPricing,
  getTestPricingData,
};
