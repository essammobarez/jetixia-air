import { FlightOfferQuery } from "./priceList.interface";
import { AmadeusFlightOffersResponse } from "./priceList.interface";
import { searchFlightOffers } from "./priceList.service";
import { searchEbookingFlightOffers } from "./ebooking.service";
import {
  normalizeAmadeusOffer,
  normalizeEbookingOffer,
  createMultiSupplierResponse,
} from "./response.normalizer";
import { SimplifiedFlightOffer } from "./ebooking.interface";

export type SupplierType = "amadeus" | "ebooking" | "both";

export interface SupplierResult {
  supplier: string;
  success: boolean;
  data?: any;
  simplified?: SimplifiedFlightOffer[];
  error?: string;
}

/**
 * Search flights from Amadeus supplier
 */
async function searchAmadeusFlights(
  query: FlightOfferQuery
): Promise<SupplierResult> {
  try {
    console.log("🔍 Searching flights from Amadeus...");
    const result = await searchFlightOffers(query);

    // Convert to simplified format
    const simplified = result.data.map(normalizeAmadeusOffer);

    return {
      supplier: "amadeus",
      success: true,
      data: result,
      simplified,
    };
  } catch (error) {
    console.error("❌ Amadeus search failed:", error);
    return {
      supplier: "amadeus",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search flights from ebooking supplier
 */
async function searchEbookingFlights(
  query: FlightOfferQuery
): Promise<SupplierResult> {
  try {
    console.log("🔍 Searching flights from ebooking...");
    const result = await searchEbookingFlightOffers(query);

    console.log("🔍 ebooking result:", JSON.stringify(result, null, 2));
    console.log("🔍 ebooking offers count:", result.offers?.length || 0);

    // Convert to simplified format
    console.log("🔍 Starting normalization of ebooking offers...");
    const simplified = result.offers.map((offer, index) => {
      try {
        console.log(
          `🔍 Normalizing offer ${index + 1}/${result.offers.length}`
        );
        console.log(
          `🔍 Offer has flightDetails before normalization?`,
          !!offer.flightDetails
        );
        console.log(
          `🔍 Offer flightDetails length?`,
          offer.flightDetails?.length
        );
        return normalizeEbookingOffer(offer);
      } catch (error) {
        console.error(`❌ Error normalizing offer ${index + 1}:`, error);
        throw error;
      }
    });

    return {
      supplier: "ebooking",
      success: true,
      data: result,
      simplified,
    };
  } catch (error) {
    console.error("❌ ebooking search failed:", error);
    return {
      supplier: "ebooking",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search flights from multiple suppliers
 */
export async function searchFlightsFromSuppliers(
  query: FlightOfferQuery,
  suppliers: SupplierType
): Promise<{
  raw: any;
  simplified: any;
  meta: any;
}> {
  const results: SupplierResult[] = [];
  const errors: { amadeus?: string; ebooking?: string } = {};

  // Determine which suppliers to search
  const searchAmadeus = suppliers === "amadeus" || suppliers === "both";
  const searchEbooking = suppliers === "ebooking" || suppliers === "both";

  // Execute searches in parallel
  const promises: Promise<SupplierResult>[] = [];

  if (searchAmadeus) {
    promises.push(searchAmadeusFlights(query));
  }

  if (searchEbooking) {
    promises.push(searchEbookingFlights(query));
  }

  // Wait for all searches to complete
  const searchResults = await Promise.allSettled(promises);

  // Process results
  searchResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      const supplier = searchAmadeus && index === 0 ? "amadeus" : "ebooking";
      errors[supplier] = result.reason?.message || "Search failed";
      results.push({
        supplier,
        success: false,
        error: result.reason?.message || "Search failed",
      });
    }
  });

  // Extract successful results
  const amadeusResult = results.find(
    (r) => r.supplier === "amadeus" && r.success
  );
  const ebookingResult = results.find(
    (r) => r.supplier === "ebooking" && r.success
  );

  // Create response
  return createMultiSupplierResponse(
    amadeusResult?.data,
    ebookingResult?.data,
    amadeusResult?.simplified || [],
    ebookingResult?.simplified || [],
    Object.keys(errors).length > 0 ? errors : undefined
  );
}

/**
 * Get supplier status and capabilities
 */
export function getSupplierInfo() {
  return {
    amadeus: {
      name: "Amadeus",
      available:
        !!process.env.AMADEUS_CLIENT_ID && !!process.env.AMADEUS_CLIENT_SECRET,
      features: [
        "one-way",
        "round-trip",
        "multi-city",
        "airline-enrichment",
        "airport-enrichment",
      ],
    },
    ebooking: {
      name: "ebooking",
      available:
        !!process.env.EBOOKING_CLIENT_ID &&
        !!process.env.EBOOKING_CLIENT_SECRET,
      features: ["one-way", "round-trip", "multi-city"],
    },
  };
}
