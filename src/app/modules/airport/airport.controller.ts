import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { airportSearchService } from "./airport.service";

const searchAirports = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm, limit, page } = req.query;

  const result = await airportSearchService.searchAirports({
    searchTerm,
    limit,
    page,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Airports searched successfully!",
    data: {
      airports: result.airports,
      pagination: {
        total: result.total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        totalPages: Math.ceil(result.total / (Number(limit) || 10)),
      },
    },
  });
});

const getAllAirports = catchAsync(async (req: Request, res: Response) => {
  const { limit, page } = req.query;

  const result = await airportSearchService.getAllAirports({
    limit,
    page,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All airports fetched successfully!",
    data: {
      airports: result.airports,
      pagination: {
        total: result.total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        totalPages: Math.ceil(result.total / (Number(limit) || 10)),
      },
    },
  });
});

const getAirportById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const airport = await airportSearchService.getAirportById(id);

  if (!airport) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Airport not found",
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Airport fetched successfully!",
    data: airport,
  });
});

export const AirportController = {
  searchAirports,
  getAllAirports,
  getAirportById,
};
