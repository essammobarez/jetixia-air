import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { bookFlightService } from "./bookFlight.service";

export const bookFlight = catchAsync(async (req: Request, res: Response) => {
    const { srk, offerIndex, searchToken, availabilityToken, clientRef, travelers } = req.body;

    const result = await bookFlightService(srk, offerIndex, searchToken, {
        availabilityToken,
        clientRef,
        travelers,
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Flight booked successfully",
        data: result,
    });
});
