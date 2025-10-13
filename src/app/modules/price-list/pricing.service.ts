import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  FlightOfferPricingRequest,
  FlightOfferPricingResponse,
} from "./pricing.interface";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "./priceList.utils";
import { AirlineInfo, AirportInfo } from "./priceList.interface";

// Cache for airline information (shared with search API)
const airlineCache = new Map<string, AirlineInfo>();

// Cache for airport information (shared with search API)
const airportCache = new Map<string, AirportInfo>();

/**
 * Fetch airline information by IATA code from Amadeus API
 */
async function getAirlineInfo(
  airlineCode: string,
  token: string
): Promise<AirlineInfo | null> {
  if (airlineCache.has(airlineCode)) {
    return airlineCache.get(airlineCode)!;
  }

  try {
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/reference-data/airlines`;
    const response = await axios.get(url, {
      params: { airlineCodes: airlineCode },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.data && response.data.data.length > 0) {
      const airlineData = response.data.data[0];
      const airlineInfo: AirlineInfo = {
        iataCode: airlineData.iataCode,
        icaoCode: airlineData.icaoCode,
        businessName: airlineData.businessName,
        commonName: airlineData.commonName,
      };

      airlineCache.set(airlineCode, airlineInfo);
      return airlineInfo;
    }

    return null;
  } catch (error: unknown) {
    const err = error as { message?: string };
    return null;
  }
}

/**
 * Fetch airport information by IATA code from Amadeus API
 */
async function getAirportInfo(
  iataCode: string,
  token: string
): Promise<AirportInfo | null> {
  if (airportCache.has(iataCode)) {
    return airportCache.get(iataCode)!;
  }

  try {
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/reference-data/locations`;
    const response = await axios.get(url, {
      params: {
        subType: "AIRPORT",
        keyword: iataCode,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.data && response.data.data.length > 0) {
      const location = response.data.data[0];
      const airportInfo: AirportInfo = {
        iataCode: location.iataCode,
        name: location.name,
        cityName: location.address?.cityName || "",
        countryName: location.address?.countryName || "",
        countryCode: location.address?.countryCode || "",
      };

      airportCache.set(iataCode, airportInfo);
      return airportInfo;
    }

    return null;
  } catch (error: unknown) {
    const err = error as { message?: string };
    return null;
  }
}

/**
 * Enrich confirmed flight offers with airline and airport information
 */
async function enrichPricingFlightOffers(
  flightOffers: any[],
  token: string
): Promise<any[]> {
  // Collect unique codes
  const carrierCodes = new Set<string>();
  const airportCodes = new Set<string>();

  flightOffers.forEach((offer) => {
    offer.itineraries?.forEach((itinerary: any) => {
      itinerary.segments?.forEach((segment: any) => {
        if (segment.carrierCode) carrierCodes.add(segment.carrierCode);
        if (segment.operating?.carrierCode) {
          carrierCodes.add(segment.operating.carrierCode);
        }
        if (segment.departure?.iataCode) {
          airportCodes.add(segment.departure.iataCode);
        }
        if (segment.arrival?.iataCode) {
          airportCodes.add(segment.arrival.iataCode);
        }
      });
    });

    if (offer.validatingAirlineCodes) {
      offer.validatingAirlineCodes.forEach((code: string) =>
        carrierCodes.add(code)
      );
    }
  });

  // Fetch all information in parallel
  const airlinePromises = Array.from(carrierCodes).map((code) =>
    getAirlineInfo(code, token)
  );
  const airportPromises = Array.from(airportCodes).map((code) =>
    getAirportInfo(code, token)
  );

  await Promise.all([...airlinePromises, ...airportPromises]);

  // Enrich the flight offers
  const enrichedOffers = flightOffers.map((offer) => {
    const enrichedItineraries = offer.itineraries?.map((itinerary: any) => {
      const enrichedSegments = itinerary.segments?.map((segment: any) => {
        const carrierInfo = airlineCache.get(segment.carrierCode);
        const operatingCarrierInfo = segment.operating?.carrierCode
          ? airlineCache.get(segment.operating.carrierCode)
          : null;
        const departureAirport = airportCache.get(segment.departure?.iataCode);
        const arrivalAirport = airportCache.get(segment.arrival?.iataCode);

        return {
          ...segment,
          carrierName: carrierInfo?.businessName || segment.carrierCode,
          operating: segment.operating
            ? {
                ...segment.operating,
                carrierName:
                  operatingCarrierInfo?.businessName ||
                  segment.operating.carrierCode,
              }
            : segment.operating,
          departure: segment.departure
            ? {
                ...segment.departure,
                airportName: departureAirport?.name,
                cityName: departureAirport?.cityName,
                countryName: departureAirport?.countryName,
              }
            : segment.departure,
          arrival: segment.arrival
            ? {
                ...segment.arrival,
                airportName: arrivalAirport?.name,
                cityName: arrivalAirport?.cityName,
                countryName: arrivalAirport?.countryName,
              }
            : segment.arrival,
        };
      });

      return {
        ...itinerary,
        segments: enrichedSegments,
      };
    });

    return {
      ...offer,
      itineraries: enrichedItineraries,
    };
  });

  return enrichedOffers;
}

/**
 * Get confirmed flight pricing with detailed information
 * Endpoint: POST /v1/shopping/flight-offers/pricing
 * Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-price
 */
export const getFlightOfferPricing = async (
  request: FlightOfferPricingRequest
): Promise<FlightOfferPricingResponse> => {
  try {
    // Step 1: Get access token with authorization
    const token = await getAmadeusAccessToken();

    // Step 2: Build request body
    const requestBody = {
      data: {
        type: "flight-offers-pricing",
        flightOffers: request.flightOffers,
      },
    };

    // Step 3: Build query parameters for additional data
    const params = {
      include: "credit-card-fees,bags,other-services,detailed-fare-rules",
      forceClass: false,
    };

    // Step 4: Call Amadeus Flight Offers Pricing API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/shopping/flight-offers/pricing`;

    const response = await axios.post(url, requestBody, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const pricingResponse: FlightOfferPricingResponse = response.data;

    // Enrich flight offers with airline and airport information
    if (
      pricingResponse.data?.flightOffers &&
      pricingResponse.data.flightOffers.length > 0
    ) {
      const enrichedOffers = await enrichPricingFlightOffers(
        pricingResponse.data.flightOffers,
        token
      );
      pricingResponse.data.flightOffers = enrichedOffers;
    }

    return pricingResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        data?: {
          errors?: Array<{ detail?: string; title?: string }>;
        };
      };
      message?: string;
    };

    // Error fetching flight pricing

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid flight offer data or pricing request";
      throw new AppError(httpStatus.BAD_REQUEST, errorDetail);
    }

    if (err?.response?.status === 401) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication failed with Amadeus API. Please check your credentials."
      );
    }

    if (err?.response?.status === 404) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Flight offer not found or no longer available"
      );
    }

    if (err?.response?.status === 409) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Flight offer price has changed or is no longer available"
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get flight pricing from Amadeus API"
    );
  }
};
