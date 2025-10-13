import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { getFlightOfferPricing } from "./pricing.service";
import { FlightOfferPricingRequest } from "./pricing.interface";
import { mockPricingConfirmationData } from "./pricing.test";

const confirmFlightPricing = catchAsync(async (req: Request, res: Response) => {
  const request: FlightOfferPricingRequest = {
    flightOffers: req.body.flightOffers,
  };

  const result = await getFlightOfferPricing(request);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight pricing confirmed successfully!",
    data: result,
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
