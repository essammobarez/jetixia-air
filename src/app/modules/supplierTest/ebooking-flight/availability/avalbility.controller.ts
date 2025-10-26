import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { checkFlightAvailabilityService } from "./avalbility.service";

const checkAvailability = catchAsync(async (req: Request, res: Response) => {
  const { srk, offerIndex, ...restBody } = req.body;

  const data = await checkFlightAvailabilityService(srk, offerIndex, restBody);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight availability fetched successfully!",
    data,
  });
});

export const FlightsAvailabilityController = { checkAvailability };
