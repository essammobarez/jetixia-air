import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { searchFlightOffers } from "./priceList.service";
import { FlightOfferQuery } from "./priceList.interface";

const getFlightOffers = catchAsync(async (req: Request, res: Response) => {
  const query: FlightOfferQuery = {
    originLocationCode: req.body.originLocationCode,
    destinationLocationCode: req.body.destinationLocationCode,
    departureDate: req.body.departureDate,
    adults: req.body.adults,
    returnDate: req.body.returnDate,
    children: req.body.children,
    infants: req.body.infants,
    travelClass: req.body.travelClass,
    nonStop: req.body.nonStop,
    max: req.body.max,
  };

  const result = await searchFlightOffers(query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight offers fetched successfully!",
    data: result,
  });
});

export const PriceListController = {
  getFlightOffers,
};
