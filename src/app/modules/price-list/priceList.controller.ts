import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { searchFlightOffers } from "./priceList.service";
import { FlightOfferQuery } from "./priceList.interface";
import {
  searchFlightsFromSuppliers,
  getSupplierInfo,
} from "./supplier.factory";

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
    supplier: req.body.supplier || "amadeus",
    wholesalerId: req.body.wholesalerId,
  };

  // Use supplier factory for multi-supplier support
  const result = await searchFlightsFromSuppliers(
    query,
    query.supplier || "amadeus"
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flight offers fetched successfully!",
    data: result,
  });
});

// Legacy endpoint for backward compatibility (Amadeus only)
const getAmadeusFlightOffers = catchAsync(
  async (req: Request, res: Response) => {
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
      supplier: "amadeus",
    };

    const result = await searchFlightOffers(query);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Amadeus flight offers fetched successfully!",
      data: result,
    });
  }
);

// Get supplier information and status
const getSupplierStatus = catchAsync(async (req: Request, res: Response) => {
  const supplierInfo = getSupplierInfo();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supplier information retrieved successfully!",
    data: supplierInfo,
  });
});

export const PriceListController = {
  getFlightOffers,
  getAmadeusFlightOffers,
  getSupplierStatus,
};
