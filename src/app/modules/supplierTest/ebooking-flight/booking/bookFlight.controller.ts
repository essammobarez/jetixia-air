import { Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { bookFlightService } from "./bookFlight.service";

export const bookFlight = catchAsync(async (req: Request, res: Response) => {
  const {
    srk,
    offerIndex,
    searchToken,
    availabilityToken,
    clientRef,
    wholealerId,
    supplierId,
    travelers,
  } = req.body;

  const normalizedTravelers = (travelers || []).map((t: any) => {
    let ptc = (t.ptc || t.type || "").toString().trim().toLowerCase();

    if (ptc === "adult") ptc = "ADT";
    else if (ptc === "child") ptc = "CHD";
    else ptc = ptc.toUpperCase();

    return {
      ...t,
      ptc,
      type:
        t.type || (ptc === "ADT" ? "adult" : ptc === "CHD" ? "child" : t.type),
    };
  });

  const result = await bookFlightService(srk, offerIndex, searchToken, wholealerId,supplierId,{
    availabilityToken,
    clientRef,
    travelers: normalizedTravelers,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Flight booked successfully",
    data: result,
  });
});
