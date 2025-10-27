import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { getEbookingAccessToken, getEbookingBaseUrl } from "./ebooking.utils";
import {
  EbookingSearchRequest,
  EbookingSearchResponse,
  EbookingFlightOffer,
  EbookingFlightDetails,
  EbookingDataLists,
} from "./ebooking.interface";
import { FlightOfferQuery } from "./priceList.interface";

/**
 * Convert FlightOfferQuery to ebooking search request format
 */
function convertToEbookingRequest(
  query: FlightOfferQuery
): EbookingSearchRequest {
  const originDestinations = [
    {
      origin: { code: query.originLocationCode },
      destination: { code: query.destinationLocationCode },
      date: query.departureDate,
    },
  ];

  // Add return date for round-trip
  if (query.returnDate) {
    originDestinations.push({
      origin: { code: query.destinationLocationCode },
      destination: { code: query.originLocationCode },
      date: query.returnDate,
    });
  }

  // Build passenger list
  const ptcList: Array<{ ptc: "ADT" | "CHD" | "INF"; count: number }> = [
    { ptc: "ADT", count: query.adults },
  ];

  if (query.children && query.children > 0) {
    ptcList.push({ ptc: "CHD", count: query.children });
  }

  if (query.infants && query.infants > 0) {
    ptcList.push({ ptc: "INF", count: query.infants });
  }

  return {
    originDestinations,
    passengers: {
      leaderNationality: 158, // Default to US nationality, can be made configurable
      ptcList,
    },
    sellingChannel: "B2B",
    language: "en_GB",
    timeout: 10,
  };
}

/**
 * Search flights using ebooking API
 * Uses only Search API (no Results API needed)
 */
export const searchEbookingFlights = async (
  query: FlightOfferQuery
): Promise<EbookingSearchResponse> => {
  try {
    // Step 1: Get access token
    const token = await getEbookingAccessToken();
    console.log("ebooking token", token);
    // Step 2: Convert query to ebooking format
    const searchRequest = convertToEbookingRequest(query);

    // Debug: Log the search request
    console.log(
      "🔍 ebooking search request:",
      JSON.stringify(searchRequest, null, 2)
    );

    // Step 3: Make search request
    const baseUrl = getEbookingBaseUrl();
    const searchUrl = `${baseUrl}/tbs/reseller/api/flights/v1/search`;

    const response = await axios.post(searchUrl, searchRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const searchResponse: EbookingSearchResponse = response.data;

    console.log(
      "✅ ebooking search successful, offers count:",
      searchResponse.offers?.length || 0
    );

    return searchResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: { status: number; data: unknown };
      request?: unknown;
      message?: string;
    };

    console.error("❌ Error searching ebooking flights:", err);

    if (err.response) {
      console.error("Response error:", err.response.status, err.response.data);
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to search flights from ebooking API"
    );
  }
};

/**
 * Extract flight details from ebooking dataLists using flight references
 */
export const getEbookingFlightDetails = (
  flightReferences: string[],
  dataLists: EbookingDataLists
): EbookingFlightDetails[] => {
  try {
    if (!dataLists.flightList || !dataLists.flightSegmentList) {
      return [];
    }

    const flightDetails: EbookingFlightDetails[] = [];

    // Find flights that match the references
    for (const flightRef of flightReferences) {
      console.log(`🔍 Looking for flight reference: ${flightRef}`);
      const flight = dataLists.flightList.find((f) => f.key === flightRef);
      console.log(`🔍 Flight found:`, !!flight);
      if (!flight) {
        console.log(
          `⚠️  Flight reference ${flightRef} not found in flightList`
        );
        continue;
      }

      // Get segments for this flight
      console.log(`🔍 Flight segmentReferences:`, flight.segmentReferences);
      const segments = dataLists.flightSegmentList.filter((segment) =>
        flight.segmentReferences.includes(segment.key)
      );
      console.log(`🔍 Segments found: ${segments.length}`);

      // Convert segments to flight details
      for (const segment of segments) {
        flightDetails.push({
          flightReference: segment.key,
          departure: {
            airport: segment.departure.airport.code,
            terminal: segment.departure.terminal,
            time: segment.departure.time,
            date: segment.departure.date,
            city:
              segment.departure.city?.code || segment.departure.airport.code,
            airportName: segment.departure.airport.name,
          },
          arrival: {
            airport: segment.arrival.airport.code,
            terminal: segment.arrival.terminal,
            time: segment.arrival.time,
            date: segment.arrival.date,
            city: segment.arrival.city?.code || segment.arrival.airport.code,
            airportName: segment.arrival.airport.name,
          },
          airline: {
            code: segment.marketingCarrier.airline.code,
            name: segment.marketingCarrier.airline.name,
          },
          operatingAirline:
            segment.operatingCarrier.airline.name ||
            segment.marketingCarrier.airline.name,
          flightNumber: `${segment.marketingCarrier.airline.code}${segment.marketingCarrier.flightNumber}`,
          aircraft: segment.equipment.code,
          equipmentName: segment.equipment.name,
          duration: segment.flightDetails.duration || "Unknown",
          stops: segments.length > 1 ? segments.length - 1 : 0,
        });
      }
    }

    console.log(
      `🔍 Extracted ${flightDetails.length} flight details from dataLists`
    );
    console.log(
      "🔍 Final flightDetails:",
      JSON.stringify(flightDetails, null, 2)
    );
    return flightDetails;
  } catch (error: unknown) {
    console.error("❌ Error extracting flight details:", error);
    return [];
  }
};

/**
 * Complete ebooking flight search process
 * Uses only Search API (no Results API needed)
 */
export const searchEbookingFlightOffers = async (
  query: FlightOfferQuery
): Promise<{ raw: EbookingSearchResponse; offers: EbookingFlightOffer[] }> => {
  // Use only the Search API - it returns offers directly
  const searchResponse = await searchEbookingFlights(query);

  // Extract offers from search response
  const offers: EbookingFlightOffer[] = searchResponse.offers || [];

  // Extract flight details from dataLists for each offer
  // Expand offers - each unique itinerary variant should be a separate offer
  const expandedOffers: EbookingFlightOffer[] = [];

  if (offers.length > 0 && searchResponse.dataLists) {
    console.log("🔍 Extracting flight details from dataLists...");

    for (const offer of offers) {
      if (offer.flightsOverview && offer.flightsOverview.length > 0) {
        // Extract flight references per itinerary
        for (const overview of offer.flightsOverview) {
          const flightReferences = overview.flightReferences || [];

          if (flightReferences.length > 0) {
            console.log(
              `🔍 Getting flight details for offer ${offer.index}, itinerary ${overview.itineraryIndex}`
            );
            console.log(`🔍 Flight references:`, flightReferences);

            const flightDetails = getEbookingFlightDetails(
              flightReferences,
              searchResponse.dataLists
            );

            console.log(
              `🔍 Extracted ${flightDetails.length} flight details for this itinerary`
            );
            console.log(
              `🔍 Flight details:`,
              JSON.stringify(flightDetails, null, 2)
            );

            // Create a separate offer for each unique itinerary variant
            const newOffer = {
              ...offer,
              flightDetails: flightDetails,
              // Add a unique identifier for this itinerary variant
              itineraryVariant: overview.itineraryIndex,
              // Create a unique index for this variant
              uniqueIndex: `${offer.index}-variant-${overview.itineraryIndex}`,
            };

            expandedOffers.push(newOffer);
          }
        }
      }
    }

    console.log(
      `✅ Expanded ${offers.length} offers into ${expandedOffers.length} unique itineraries`
    );
  }

  return {
    raw: searchResponse,
    offers: expandedOffers.length > 0 ? expandedOffers : offers,
  };
};
