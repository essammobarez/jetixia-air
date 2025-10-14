import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { getSeatMaps } from "./seatmap.service";
import { SeatMapRequest } from "./seatmap.interface";

const fetchSeatMaps = catchAsync(async (req: Request, res: Response) => {
  const request: SeatMapRequest = {
    flightOffers: req.body.flightOffers,
  };

  const result = await getSeatMaps(request);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seat maps retrieved successfully!",
    data: result,
  });
});

export const SeatMapController = {
  fetchSeatMaps,
};
