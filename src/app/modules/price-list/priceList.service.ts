import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  FlightOfferQuery,
  AmadeusFlightOffersResponse,
  AirlineInfo,
  AirportInfo,
  FlightOffer,
} from "./priceList.interface";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "./priceList.utils";

// Cache for airline information to avoid repeated API calls
const airlineCache = new Map<string, AirlineInfo>();

// Cache for airport information to avoid repeated API calls
const airportCache = new Map<string, AirportInfo>();

/**
 * Fetch airline information by IATA code from Amadeus API
 * Endpoint: GET /v1/reference-data/airlines
 */
async function getAirlineInfo(
  airlineCode: string,
  token: string
): Promise<AirlineInfo | null> {
  // Check cache first
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

      // Cache the result
      airlineCache.set(airlineCode, airlineInfo);
      console.log(
        `✈️  Cached airline: ${airlineCode} → ${airlineInfo.businessName}`
      );
      return airlineInfo;
    }

    return null;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error(
      `⚠️  Error fetching airline info for ${airlineCode}:`,
      err.message
    );
    return null;
  }
}

/**
 * Fetch airport information by IATA code from Amadeus API
 * Endpoint: GET /v1/reference-data/locations
 */
async function getAirportInfo(
  iataCode: string,
  token: string
): Promise<AirportInfo | null> {
  // Check cache first
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

      // Cache the result
      airportCache.set(iataCode, airportInfo);
      console.log(
        `🏢 Cached airport: ${iataCode} → ${airportInfo.name}, ${airportInfo.cityName}`
      );
      return airportInfo;
    }

    return null;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error(
      `⚠️  Error fetching airport info for ${iataCode}:`,
      err.message
    );
    return null;
  }
}

/**
 * Enrich flight offers with airline business names and airport information
 * Replaces carrierCode with carrierName (business name)
 * Adds airport names, city names, and country names
 */
async function enrichFlightOffersWithAirlineNames(
  flightOffers: FlightOffer[],
  token: string
): Promise<FlightOffer[]> {
  // Collect all unique carrier codes and airport codes
  const carrierCodes = new Set<string>();
  const airportCodes = new Set<string>();

  flightOffers.forEach((offer) => {
    offer.itineraries.forEach((itinerary) => {
      itinerary.segments.forEach((segment) => {
        // Collect carrier codes
        carrierCodes.add(segment.carrierCode);
        if (segment.operating?.carrierCode) {
          carrierCodes.add(segment.operating.carrierCode);
        }

        // Collect airport codes
        airportCodes.add(segment.departure.iataCode);
        airportCodes.add(segment.arrival.iataCode);
      });
    });

    if (offer.validatingAirlineCodes) {
      offer.validatingAirlineCodes.forEach((code) => carrierCodes.add(code));
    }
  });

  console.log(`🔍 Found ${carrierCodes.size} unique carrier codes to enrich`);
  console.log(`🔍 Found ${airportCodes.size} unique airport codes to enrich`);

  // Fetch airline information for all carrier codes in parallel
  const airlinePromises = Array.from(carrierCodes).map((code) =>
    getAirlineInfo(code, token)
  );

  // Fetch airport information for all airport codes in parallel
  const airportPromises = Array.from(airportCodes).map((code) =>
    getAirportInfo(code, token)
  );

  await Promise.all([...airlinePromises, ...airportPromises]);

  // Now enrich the flight offers with airline names and airport information
  const enrichedOffers = flightOffers.map((offer) => {
    const enrichedItineraries = offer.itineraries.map((itinerary) => {
      const enrichedSegments = itinerary.segments.map((segment) => {
        // Get airline information
        const carrierInfo = airlineCache.get(segment.carrierCode);
        const operatingCarrierInfo = segment.operating?.carrierCode
          ? airlineCache.get(segment.operating.carrierCode)
          : null;

        // Get airport information
        const departureAirport = airportCache.get(segment.departure.iataCode);
        const arrivalAirport = airportCache.get(segment.arrival.iataCode);

        return {
          ...segment,
          carrierName: carrierInfo?.businessName || segment.carrierCode,
          operating: {
            ...segment.operating,
            carrierName:
              operatingCarrierInfo?.businessName ||
              segment.operating.carrierCode,
          },
          departure: {
            ...segment.departure,
            airportName: departureAirport?.name,
            cityName: departureAirport?.cityName,
            countryName: departureAirport?.countryName,
          },
          arrival: {
            ...segment.arrival,
            airportName: arrivalAirport?.name,
            cityName: arrivalAirport?.cityName,
            countryName: arrivalAirport?.countryName,
          },
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

  console.log(
    "✨ Flight offers enriched with airline names and airport information"
  );
  return enrichedOffers;
}

/**
 * Search flight offers from Amadeus API
 * Endpoint: GET /v2/shopping/flight-offers
 * Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
 */
export const searchFlightOffers = async (
  query: FlightOfferQuery
): Promise<AmadeusFlightOffersResponse> => {
  try {
    console.log("🔎 Searching flight offers from Amadeus API...");

    // Step 1: Get access token with authorization
    const token = await getAmadeusAccessToken();

    // Step 2: Build query parameters
    const params: Record<string, string | number | boolean> = {
      originLocationCode: query.originLocationCode,
      destinationLocationCode: query.destinationLocationCode,
      departureDate: query.departureDate,
      adults: query.adults,
      nonStop: query.nonStop ?? false,
      currencyCode: "USD", // Fixed to USD
      max: query.max || 250,
    };

    if (query.returnDate) {
      params.returnDate = query.returnDate;
    }

    if (query.children) {
      params.children = query.children;
    }

    if (query.infants) {
      params.infants = query.infants;
    }

    if (query.travelClass) {
      params.travelClass = query.travelClass;
    }

    console.log("📋 Request parameters:", JSON.stringify(params, null, 2));

    // Step 3: Fetch flight offers
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v2/shopping/flight-offers`;
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const flightOffersResponse: AmadeusFlightOffersResponse = response.data;

    console.log(`✅ Found ${flightOffersResponse.meta.count} flight offers`);

    // Step 4: Enrich flight offers with airline business names
    if (flightOffersResponse.data && flightOffersResponse.data.length > 0) {
      const enrichedOffers = await enrichFlightOffersWithAirlineNames(
        flightOffersResponse.data,
        token
      );

      flightOffersResponse.data = enrichedOffers;
    }

    return flightOffersResponse;
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

    console.error("❌ Error fetching flight offers:");
    console.error(err?.response?.data || err.message);

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid request parameters";
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
        "No flight offers found for the given search criteria"
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch flight offers from Amadeus API"
    );
  }
};
