import { Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { searchAirlines } from "./airline.service";

export const searchAirlinesController = catchAsync(
  async (req: Request, res: Response) => {
    const { airline } = req.body;

    const result = await searchAirlines(airline);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Airlines fetched successfully",
      data: result,
    });
  }
);
