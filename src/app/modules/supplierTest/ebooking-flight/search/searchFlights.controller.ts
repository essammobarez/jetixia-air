import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { searchFlightsService } from "./searchFlights.service";
import { searchLocationByName } from "./searchDB.service";

const fetchFlights = catchAsync(async (req: Request, res: Response) => {
  const {
    from,
    to,
    tripType,
    segments,
    traveller,
    classType,
    airline,
    nationality,
    date,
  } = req.body;

  const lowerTrip = (tripType || "").toLowerCase();

  if (lowerTrip === "oneway" && (!segments || segments.length !== 1)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "One way must have exactly 1 segment",
      data: null,
    });
  }

  if (lowerTrip === "roundtrip" && (!segments || segments.length !== 2)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Round trip must have exactly 2 segments",
      data: null,
    });
  }

  if (lowerTrip === "multicity" && (!segments || segments.length < 2)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Multi city must have at least 2 segments",
      data: null,
    });
  }

  let originDestinations;

  if (lowerTrip === "multicity") {
    originDestinations = await Promise.all(
      segments.map(async (seg: { from: string; to: string; date: string }) => {
        const fromRes = await searchLocationByName(seg.from);
        const toRes = await searchLocationByName(seg.to);

        if (!fromRes.length || !toRes.length) {
          throw new Error(
            `Location not found for segment: ${seg.from} -> ${seg.to}`
          );
        }

        return {
          origin: { code: fromRes[0].code },
          destination: { code: toRes[0].code },
          date: seg.date,
        };
      })
    );
  } else {
    const resultsFrom = await searchLocationByName(from || segments?.[0]?.from);
    const resultsTo = await searchLocationByName(to || segments?.[0]?.to);
    console.log(resultsFrom, resultsTo);
    if (!resultsFrom.length || !resultsTo.length) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "From or To location not found",
        data: null,
      });
    }

    if (segments?.length) {
      originDestinations = await Promise.all(
        segments.map(
          async (seg: { from: string; to: string; date: string }) => {
            const fromRes = await searchLocationByName(seg.from);
            const toRes = await searchLocationByName(seg.to);
            return {
              origin: { code: fromRes[0].code },
              destination: { code: toRes[0].code },
              date: seg.date,
            };
          }
        )
      );
    } else {
      originDestinations = [
        {
          origin: { code: resultsFrom[0].code },
          destination: { code: resultsTo[0].code },
          date: date || new Date().toISOString().split("T")[0],
        },
      ];
    }
  }

  const normalizedTravellers = (traveller || [{ ptc: "ADT", count: 1 }]).map(
    (t: any) => {
      let ptcUpper = (t.ptc || "").toString().trim().toLowerCase();
      if (ptcUpper === "adult") ptcUpper = "ADT";
      else if (ptcUpper === "child") ptcUpper = "CHD";
      else ptcUpper = ptcUpper.toUpperCase();
      return { ...t, ptc: ptcUpper };
    }
  );

  const passengers = {
    leaderNationality: nationality || 158,
    ptcList: normalizedTravellers,
  };

  const payload = {
    originDestinations,
    passengers,
    classType,
    airline,
    sellingChannel: "B2B",
    language: "en_GB",
    timeout: 10,
  };

  const data = await searchFlightsService(payload);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flights fetched successfully!",
    data,
  });
});

export const FlightsController = { fetchFlights };
