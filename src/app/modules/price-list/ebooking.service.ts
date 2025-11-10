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
    timeout: 30,
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
    console.log("\n=== 🛫 EBOOKING FLIGHT SEARCH ===");
    console.log("📋 Search Parameters:");
    console.log("   - Origin:", query.originLocationCode);
    console.log("   - Destination:", query.destinationLocationCode);
    console.log("   - Departure:", query.departureDate);
    console.log("   - Return:", query.returnDate || "One-way");
    console.log("   - Adults:", query.adults);
    console.log("   - Children:", query.children || 0);
    console.log("   - Infants:", query.infants || 0);
    console.log("   - Wholesaler ID:", query.wholesalerId);

    // Step 1: Get access token
    console.log("🔐 Fetching access token...");
    const token = await getEbookingAccessToken(
      "680e4431309622be28c28eda",
      query.wholesalerId
    );
    console.log(
      "🔑 Token obtained for API request:",
      token ? token.substring(0, 20) + "..." : "NULL"
    );

    // Step 2: Convert query to ebooking format
    const searchRequest = convertToEbookingRequest(query);

    console.log("📤 Sending search request to ebooking API");
    console.log("   Request Body:", JSON.stringify(searchRequest, null, 2));

    // Step 3: Make search request
    const baseUrl = getEbookingBaseUrl();
    const searchUrl = `${baseUrl}/tbs/reseller/api/flights/v1/search`;
    console.log("   URL:", searchUrl);

    const requestStartTime = Date.now();
    const response = await axios.post(searchUrl, searchRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const requestDuration = Date.now() - requestStartTime;

    const searchResponse: EbookingSearchResponse = response.data;

    console.log("📥 Search Response Received:");
    console.log("   - Status:", response.status);
    console.log("   - Duration:", requestDuration + "ms");
    console.log("   - Offers Count:", searchResponse.offers?.length || 0);
    console.log("   - Has DataLists:", !!searchResponse.dataLists);
    console.log("✅ EBOOKING FLIGHT SEARCH SUCCESSFUL");
    console.log("=== END FLIGHT SEARCH ===\n");

    return searchResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        statusText: string;
        data: unknown;
        headers: unknown;
        config?: { url?: string; method?: string; data?: unknown };
      };
      request?: unknown;
      message?: string;
      config?: { url?: string; method?: string; data?: unknown };
    };

    console.error("\n=== ❌ EBOOKING FLIGHT SEARCH FAILED ===");
    console.error("📋 Query:", JSON.stringify(query, null, 2));

    if (err.response) {
      console.error("\n📥 ====== RAW SUPPLIER ERROR RESPONSE ======");
      console.error(
        "HTTP Status:",
        err.response.status,
        err.response.statusText
      );
      console.error("\n🔴 Response Body (Raw):");
      console.error(JSON.stringify(err.response.data, null, 2));
      console.error("\n📋 Response Headers:");
      console.error(JSON.stringify(err.response.headers, null, 2));

      if (err.response.config) {
        console.error("\n📤 Request Details:");
        console.error("   - URL:", err.response.config.url);
        console.error(
          "   - Method:",
          err.response.config.method?.toUpperCase()
        );
      }
      console.error("====== END RAW SUPPLIER ERROR ======\n");
    } else if (err.request) {
      console.error("\n📤 ====== REQUEST ERROR (NO RESPONSE) ======");
      console.error("No response received from supplier");
      console.error("Error Message:", err.message);
      if (err.config?.url) {
        console.error("Request URL:", err.config.url);
      }
      console.error("====== END REQUEST ERROR ======\n");
    } else {
      console.error("\n⚠️  ====== GENERAL ERROR ======");
      console.error("Error Message:", err.message);
      console.error("====== END GENERAL ERROR ======\n");
    }

    // Log complete error object
    console.error("\n🔍 ====== COMPLETE ERROR OBJECT ======");
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch {
      console.error("Error object is not serializable:", error);
    }
    console.error("====== END COMPLETE ERROR ======");
    console.error("\n=== END FLIGHT SEARCH ERROR ===\n");

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

/**
 * Call ebooking availability API to confirm pricing
 */
export const getEbookingAvailability = async (
  srk: string,
  offerIndex: string,
  itineraryIndex: number = 0,
  token: string,
  wholesalerId?: string
) => {
  try {
    console.log("\n=== 💰 EBOOKING AVAILABILITY CHECK ===");
    console.log("📋 Request Parameters:");
    console.log("   - SRK:", srk);
    console.log("   - Offer Index:", offerIndex);
    console.log("   - Itinerary Index:", itineraryIndex);
    console.log(
      "   - Search Token:",
      token ? token.substring(0, 20) + "..." : "NULL"
    );
    console.log("   - Wholesaler ID:", wholesalerId);

    // Get access token
    console.log("🔐 Fetching access token...");
    const accessToken = await getEbookingAccessToken(
      "680e4431309622be28c28eda",
      wholesalerId
    );
    console.log(
      "🔑 Token obtained for API request:",
      accessToken ? accessToken.substring(0, 20) + "..." : "NULL"
    );

    // Build availability API URL with itinerary index
    const baseUrl = getEbookingBaseUrl();
    const availabilityUrl = `${baseUrl}/tbs/reseller/api/flights/v1/search/results/${srk}/offers/${offerIndex}/availability`;

    console.log("📤 Sending availability request");
    console.log("   URL:", availabilityUrl);

    const requestStartTime = Date.now();
    // Call availability API with itinerary index in request body
    const response = await axios.post(
      availabilityUrl,
      {
        itineraryIndex,
        upsellCode: null,
        offer: {
          itineraryIndex,
          upsellCode: null,
          optionalServiceList: [],
          mandatoryServiceList: [],
          paidSeatList: [],
        },
      },
      {
        params: { token },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const requestDuration = Date.now() - requestStartTime;

    console.log("📥 Availability Response:");
    console.log("   - Status:", response.status);
    console.log("   - Duration:", requestDuration + "ms");
    console.log("✅ EBOOKING AVAILABILITY CHECK SUCCESSFUL");
    console.log("=== END AVAILABILITY CHECK ===\n");

    return response.data;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        statusText: string;
        data: unknown;
        headers: unknown;
        config?: { url?: string; method?: string; data?: unknown };
      };
      request?: unknown;
      message?: string;
      config?: { url?: string; method?: string; data?: unknown };
    };

    console.error("\n=== ❌ EBOOKING AVAILABILITY CHECK FAILED ===");
    console.error("📋 Parameters:");
    console.error("   - SRK:", srk);
    console.error("   - Offer Index:", offerIndex);
    console.error("   - Itinerary Index:", itineraryIndex);

    if (err.response) {
      console.error("\n📥 ====== RAW SUPPLIER ERROR RESPONSE ======");
      console.error(
        "HTTP Status:",
        err.response.status,
        err.response.statusText
      );
      console.error("\n🔴 Response Body (Raw):");
      console.error(JSON.stringify(err.response.data, null, 2));
      console.error("\n📋 Response Headers:");
      console.error(JSON.stringify(err.response.headers, null, 2));

      if (err.response.config) {
        console.error("\n📤 Request Details:");
        console.error("   - URL:", err.response.config.url);
        console.error(
          "   - Method:",
          err.response.config.method?.toUpperCase()
        );
      }
      console.error("====== END RAW SUPPLIER ERROR ======\n");
    } else if (err.request) {
      console.error("\n📤 ====== REQUEST ERROR (NO RESPONSE) ======");
      console.error("No response received from supplier");
      console.error("Error Message:", err.message);
      if (err.config?.url) {
        console.error("Request URL:", err.config.url);
      }
      console.error("====== END REQUEST ERROR ======\n");
    } else {
      console.error("\n⚠️  ====== GENERAL ERROR ======");
      console.error("Error Message:", err.message);
      console.error("====== END GENERAL ERROR ======\n");
    }

    // Log complete error object
    console.error("\n🔍 ====== COMPLETE ERROR OBJECT ======");
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch {
      console.error("Error object is not serializable:", error);
    }
    console.error("====== END COMPLETE ERROR ======");
    console.error("\n=== END AVAILABILITY CHECK ERROR ===\n");

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get availability from ebooking API"
    );
  }
};

/**
 * Call ebooking seat map API
 */
export const getEbookingSeatMap = async (
  srk: string,
  offerIndex: string,
  token: string,
  availabilityToken: string,
  segmentReference: string,
  wholesalerId?: string
) => {
  try {
    console.log("\n=== 💺 EBOOKING SEATMAP REQUEST ===");
    console.log("📋 Request Parameters:");
    console.log("   - SRK:", srk);
    console.log("   - Offer Index:", offerIndex);
    console.log(
      "   - Search Token:",
      token ? token.substring(0, 20) + "..." : "NULL"
    );
    console.log(
      "   - Availability Token:",
      availabilityToken ? availabilityToken.substring(0, 20) + "..." : "NULL"
    );
    console.log("   - Segment Reference:", segmentReference);
    console.log("   - Wholesaler ID:", wholesalerId);

    // Get access token
    console.log("🔐 Fetching access token...");
    const accessToken = await getEbookingAccessToken(
      "680e4431309622be28c28eda",
      wholesalerId
    );
    console.log(
      "🔑 Token obtained for API request:",
      accessToken ? accessToken.substring(0, 20) + "..." : "NULL"
    );

    // Build seat map API URL
    const baseUrl = getEbookingBaseUrl();
    const seatMapUrl = `${baseUrl}/tbs/reseller/api/flights/v1/search/results/${srk}/offers/${offerIndex}/availability/seatMap`;

    console.log("📤 Sending seatmap request");
    console.log("   URL:", seatMapUrl);

    const requestStartTime = Date.now();
    // Call seat map API with both tokens
    const response = await axios.get(seatMapUrl, {
      params: {
        token, // Search results token
        availabilityToken, // Availability token from pricing response
        segmentReference,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const requestDuration = Date.now() - requestStartTime;

    console.log("📥 Seatmap Response:");
    console.log("   - Status:", response.status);
    console.log("   - Duration:", requestDuration + "ms");
    console.log("✅ EBOOKING SEATMAP REQUEST SUCCESSFUL");
    console.log("=== END SEATMAP REQUEST ===\n");

    return response.data;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        statusText: string;
        data: unknown;
        headers: unknown;
        config?: { url?: string; method?: string; data?: unknown };
      };
      request?: unknown;
      message?: string;
      config?: { url?: string; method?: string; data?: unknown };
    };

    console.error("\n=== ❌ EBOOKING SEATMAP REQUEST FAILED ===");
    console.error("📋 Parameters:");
    console.error("   - SRK:", srk);
    console.error("   - Offer Index:", offerIndex);
    console.error("   - Segment Reference:", segmentReference);

    if (err.response) {
      console.error("\n📥 ====== RAW SUPPLIER ERROR RESPONSE ======");
      console.error(
        "HTTP Status:",
        err.response.status,
        err.response.statusText
      );
      console.error("\n🔴 Response Body (Raw):");
      console.error(JSON.stringify(err.response.data, null, 2));
      console.error("\n📋 Response Headers:");
      console.error(JSON.stringify(err.response.headers, null, 2));

      if (err.response.config) {
        console.error("\n📤 Request Details:");
        console.error("   - URL:", err.response.config.url);
        console.error(
          "   - Method:",
          err.response.config.method?.toUpperCase()
        );
      }
      console.error("====== END RAW SUPPLIER ERROR ======\n");
    } else if (err.request) {
      console.error("\n📤 ====== REQUEST ERROR (NO RESPONSE) ======");
      console.error("No response received from supplier");
      console.error("Error Message:", err.message);
      if (err.config?.url) {
        console.error("Request URL:", err.config.url);
      }
      console.error("====== END REQUEST ERROR ======\n");
    } else {
      console.error("\n⚠️  ====== GENERAL ERROR ======");
      console.error("Error Message:", err.message);
      console.error("====== END GENERAL ERROR ======\n");
    }

    // Log complete error object
    console.error("\n🔍 ====== COMPLETE ERROR OBJECT ======");
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch {
      console.error("Error object is not serializable:", error);
    }
    console.error("====== END COMPLETE ERROR ======");
    console.error("\n=== END SEATMAP REQUEST ERROR ===\n");

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get seat map from ebooking API"
    );
  }
};
