import { FlightOffer } from "./priceList.interface";
import {
  EbookingFlightOffer,
  SimplifiedFlightOffer,
  SimplifiedSegment,
} from "./ebooking.interface";

/**
 * Convert Amadeus flight offer to simplified format
 */
export const normalizeAmadeusOffer = (
  offer: FlightOffer
): SimplifiedFlightOffer => {
  const firstItinerary = offer.itineraries[0];
  const firstSegment = firstItinerary.segments[0];
  const lastSegment =
    firstItinerary.segments[firstItinerary.segments.length - 1];

  return {
    id: offer.id,
    supplier: "amadeus",
    price: {
      currency: offer.price.currency,
      total: offer.price.total,
      base: offer.price.base,
    },
    duration: firstItinerary.duration,
    segments: firstItinerary.segments.map(
      (segment): SimplifiedSegment => ({
        departure: {
          airport: segment.departure.iataCode,
          city: segment.departure.cityName || "",
          country: segment.departure.countryName || "",
          time: segment.departure.at.split("T")[1]?.substring(0, 5) || "",
          date: segment.departure.at.split("T")[0] || "",
        },
        arrival: {
          airport: segment.arrival.iataCode,
          city: segment.arrival.cityName || "",
          country: segment.arrival.countryName || "",
          time: segment.arrival.at.split("T")[1]?.substring(0, 5) || "",
          date: segment.arrival.at.split("T")[0] || "",
        },
        airline: {
          code: segment.carrierCode,
          name: segment.carrierName || segment.carrierCode,
        },
        flightNumber: `${segment.carrierCode}${segment.number}`,
        aircraft: segment.aircraft.code,
        duration: segment.duration,
        stops: segment.numberOfStops,
      })
    ),
    airline: {
      code: firstSegment.carrierCode,
      name: firstSegment.carrierName || firstSegment.carrierCode,
    },
    stops: firstSegment.numberOfStops,
    departure: {
      airport: firstSegment.departure.iataCode,
      city: firstSegment.departure.cityName || "",
      country: firstSegment.departure.countryName || "",
      time: firstSegment.departure.at.split("T")[1]?.substring(0, 5) || "",
      date: firstSegment.departure.at.split("T")[0] || "",
    },
    arrival: {
      airport: lastSegment.arrival.iataCode,
      city: lastSegment.arrival.cityName || "",
      country: lastSegment.arrival.countryName || "",
      time: lastSegment.arrival.at.split("T")[1]?.substring(0, 5) || "",
      date: lastSegment.arrival.at.split("T")[0] || "",
    },
    raw: offer, // Keep full raw object for API compatibility
  };
};

/**
 * Convert ebooking flight offer to simplified format
 * Based on actual ebooking response structure
 */
export const normalizeEbookingOffer = (
  offer: EbookingFlightOffer
): SimplifiedFlightOffer => {
  // Debug: Log the offer structure to see what we're getting
  console.log("🔍 Normalizing ebooking offer:", JSON.stringify(offer, null, 2));

  // Handle actual ebooking response structure
  const fareDetails = offer.fareDetails || {};
  const totalPrice = fareDetails.totalPrice?.selling || {};
  const price = fareDetails.price || {};
  const brandedFare = fareDetails.brandedFare?.[0] || {};

  // Extract basic flight information
  // Use uniqueIndex if available (for expanded itinerary variants)
  const index = offer.uniqueIndex || offer.index || "unknown";
  const currency = totalPrice.currency || price.currency || "USD";
  const total = totalPrice.value || price.fullFare || "0";
  const base = price.baseFare || "0";

  // Extract route information from branded fare
  const departureAirport = brandedFare.departure || "Unknown";
  const arrivalAirport = brandedFare.arrival || "Unknown";
  const cabin = brandedFare.cabin || "Unknown";

  // Handle common airport mappings (ebooking might return alternative airports)
  const airportMappings: Record<string, string> = {
    SHJ: "DXB", // Sharjah → Dubai (same metropolitan area)
    AUH: "DXB", // Abu Dhabi → Dubai (same country)
    DWC: "DXB", // Dubai World Central → Dubai
  };

  const mappedArrivalAirport =
    airportMappings[arrivalAirport] || arrivalAirport;

  // Try to extract timing information from flight details if available
  let departureTime = "Unknown";
  let departureDate = "Unknown";
  let arrivalTime = "Unknown";
  let arrivalDate = "Unknown";
  let duration = "Unknown";
  let segments: any[] = [];

  // Debug: Check if flightDetails exists
  if (offer.flightDetails && offer.flightDetails.length > 0) {
    console.log("✅ Found flightDetails, extracting timing...");
    const firstFlight = offer.flightDetails[0];
    const lastFlight = offer.flightDetails[offer.flightDetails.length - 1];

    departureTime = firstFlight.departure.time;
    departureDate = firstFlight.departure.date;
    arrivalTime = lastFlight.arrival.time;
    arrivalDate = lastFlight.arrival.date;
    duration = offer.flightDetails
      .reduce((total: number, flight: any) => {
        // Parse duration and add (this is simplified)
        return total; // Would need proper duration parsing
      }, 0)
      .toString();

    // Convert flight details to segments with additional information
    segments = offer.flightDetails.map((flight: any) => ({
      departure: {
        airport: flight.departure.airport,
        city: flight.departure.city || flight.departure.airport,
        country: "Unknown",
        time: flight.departure.time,
        date: flight.departure.date,
        terminal: flight.departure.terminal,
        airportName: flight.departure.airportName,
      },
      arrival: {
        airport: flight.arrival.airport,
        city: flight.arrival.city || flight.arrival.airport,
        country: "Unknown",
        time: flight.arrival.time,
        date: flight.arrival.date,
        terminal: flight.arrival.terminal,
        airportName: flight.arrival.airportName,
      },
      airline: {
        code: flight.airline.code,
        name: flight.airline.name,
      },
      operatingAirline: flight.operatingAirline,
      flightNumber: flight.flightNumber,
      aircraft: flight.aircraft,
      equipmentName: flight.equipmentName,
      duration: flight.duration,
      stops: flight.stops,
    }));
  }

  // Extract additional details
  const serviceFee = price.serviceFee || 0;
  const isRefundable = fareDetails.nonRefundable === false;
  const isAutoTicketable = fareDetails.autoTicketable || false;

  return {
    id: index,
    supplier: "ebooking",
    price: {
      currency,
      total: total.toString(),
      base: base.toString(),
    },
    duration: duration,
    segments: segments,
    airline: {
      code: fareDetails.validatingCarrier?.code || "Unknown",
      name: fareDetails.validatingCarrier?.name || "Unknown",
    },
    stops: segments.length > 1 ? segments.length - 1 : 0,
    departure: {
      airport: departureAirport,
      city: "Unknown", // Will need airport enrichment
      country: "Unknown", // Will need airport enrichment
      time: departureTime,
      date: departureDate,
    },
    arrival: {
      airport: mappedArrivalAirport,
      city: "Unknown", // Will need airport enrichment
      country: "Unknown", // Will need airport enrichment
      time: arrivalTime,
      date: arrivalDate,
    },
    // Additional ebooking-specific information
    metadata: {
      cabin,
      serviceFee,
      isRefundable,
      isAutoTicketable,
      fareBasis: offer.offerItems?.[0]?.fareBasis?.[0] || "Unknown",
      offerExpiration: fareDetails.timeLimits?.offerExpiration,
      ticketingTimeLimit: fareDetails.timeLimits?.ticketingTimeLimit,
      originalArrivalAirport: arrivalAirport, // Keep original airport code
      mappedArrivalAirport: mappedArrivalAirport, // Show mapped airport code
      dataSource: "dataLists", // Reference to where timing data came from
      flightReferences:
        offer.flightsOverview?.flatMap(
          (overview: any) => overview.flightReferences || []
        ) || [],
    },
    raw: offer, // Keep full raw object for API compatibility
  };
};

/**
 * Combine and sort simplified offers from multiple suppliers
 */
export const combineSimplifiedOffers = (
  amadeusOffers: SimplifiedFlightOffer[],
  ebookingOffers: SimplifiedFlightOffer[]
): SimplifiedFlightOffer[] => {
  const combined = [...amadeusOffers, ...ebookingOffers];

  // Sort by price (total as number)
  return combined.sort((a, b) => {
    const priceA = parseFloat(a.price.total);
    const priceB = parseFloat(b.price.total);
    return priceA - priceB;
  });
};

/**
 * Create multi-supplier response structure
 */
export const createMultiSupplierResponse = (
  amadeusRaw: any,
  ebookingRaw: any,
  amadeusSimplified: SimplifiedFlightOffer[],
  ebookingSimplified: SimplifiedFlightOffer[],
  errors?: { amadeus?: string; ebooking?: string }
) => {
  const combinedSimplified = combineSimplifiedOffers(
    amadeusSimplified,
    ebookingSimplified
  );

  return {
    raw: {
      amadeus: amadeusRaw,
      ebooking: ebookingRaw,
    },
    simplified: {
      amadeus: amadeusSimplified,
      ebooking: ebookingSimplified,
      combined: combinedSimplified,
    },
    meta: {
      totalCount: combinedSimplified.length,
      suppliers: ["amadeus", "ebooking"],
      searchTime: new Date().toISOString(),
      errors,
    },
  };
};
