/**
 * Transform ebooking availability response to unified Amadeus-like format
 */

import {
  EbookingAvailabilityResponse,
  EbookingPricedOffer,
  EbookingFlightSegment,
} from "./ebooking.interface";

/**
 * Transform ebooking availability to unified pricing response format
 */
export const transformEbookingToUnified = (
  ebookingResponse: EbookingAvailabilityResponse
) => {
  const { pricedOffer, dataLists } = ebookingResponse;

  // Extract segments from dataLists
  const segments = extractSegmentsFromDataLists(dataLists);

  // Build flight offers in Amadeus-like format
  const flightOffers = buildFlightOffers(pricedOffer, segments, dataLists);

  // Build booking requirements
  const bookingRequirements = buildBookingRequirements(pricedOffer);

  // Build dictionaries
  const dictionaries = buildDictionaries(dataLists);

  return {
    warnings: [],
    data: {
      type: "flight-offers-pricing",
      flightOffers,
      bookingRequirements,
      meta: {
        offerExpiration: pricedOffer.fareDetails.timeLimits.offerExpiration,
        ticketingTimeLimit:
          pricedOffer.fareDetails.timeLimits.ticketingTimeLimit,
        lastTicketingDate: pricedOffer.fareDetails.timeLimits.lastTicketingDate,
      },
    },
    included: {
      "detailed-fare-rules": buildFareRules(pricedOffer),
      "credit-card-fees": {},
      bags: buildBaggageInfo(pricedOffer),
    },
    dictionaries,
  };
};

/**
 * Extract segments from ebooking dataLists
 */
function extractSegmentsFromDataLists(dataLists: any) {
  if (!dataLists.flightSegmentList) return [];

  return dataLists.flightSegmentList.map((segment: EbookingFlightSegment) => ({
    key: segment.key,
    departure: {
      iataCode: segment.departure.airport.code,
      terminal: segment.departure.terminal || "",
      at: `${segment.departure.date}T${segment.departure.time}:00`,
      airportName: segment.departure.airport.name,
      cityName: segment.departure.city.name,
      countryName: "", // Not in ebooking response
    },
    arrival: {
      iataCode: segment.arrival.airport.code,
      terminal: segment.arrival.terminal || "",
      at: `${segment.arrival.date}T${segment.arrival.time}:00`,
      airportName: segment.arrival.airport.name,
      cityName: segment.arrival.city.name,
      countryName: "", // Not in ebooking response
    },
    carrierCode: segment.marketingCarrier.airline.code,
    carrierName: segment.marketingCarrier.airline.name,
    number: segment.marketingCarrier.flightNumber?.toString() || "",
    aircraft: {
      code: segment.equipment?.code || "",
    },
    operating: {
      carrierCode: segment.operatingCarrier?.airline?.code || "",
      carrierName:
        segment.operatingCarrier?.airline?.name ||
        segment.marketingCarrier.airline.name,
    },
    duration: segment.flightDetails?.duration
      ? `PT${segment.flightDetails.duration.replace(":", "H")}M`
      : "",
    id: segment.key,
    numberOfStops: 0,
    blacklistedInEU: false,
  }));
}

/**
 * Build flight offers in Amadeus-like format
 */
function buildFlightOffers(pricedOffer: any, segments: any[], dataLists: any) {
  const { fareDetails, offerItems } = pricedOffer;

  // Build itinerary
  const itinerary = {
    duration: calculateTotalDuration(segments),
    segments: segments,
  };

  // Build price
  const price = {
    currency: fareDetails.totalPrice.selling.currency,
    total: fareDetails.totalPrice.selling.value.toString(),
    base: fareDetails.price.baseFare.toString(),
    fees: [
      {
        amount: fareDetails.price.serviceFee.toString(),
        type: "SUPPLIER",
      },
    ],
    grandTotal: fareDetails.totalPrice.selling.value.toString(),
  };

  // Build traveler pricings
  const travelerPricings = offerItems.map((item: any, index: number) => ({
    travelerId: (index + 1).toString(),
    fareOption: "STANDARD",
    travelerType:
      item.ptc === "ADT" ? "ADULT" : item.ptc === "CHD" ? "CHILD" : "INFANT",
    price: {
      currency: item.price.currency,
      total: item.price.fullFare.toString(),
      base: item.price.baseFare.toString(),
      taxes: item.price.taxes.map((tax: any) => ({
        amount: tax.amount.toString(),
        code: tax.code,
      })),
    },
    fareDetailsBySegment:
      item.fareComponents?.map((comp: any, idx: number) => ({
        segmentId: segments[idx]?.id || "",
        cabin: comp.cabinTypeCode || "ECONOMY",
        fareBasis: comp.fareBasisCode || item.fareBasis[0],
        class: comp.classOfService || "",
        includedCheckedBags: item.baggageAllowance?.[idx] || {},
      })) || [],
  }));

  // Build validating airline codes
  const validatingAirlineCodes = [fareDetails.validatingCarrier.code];

  // Build pricing options
  const pricingOptions = {
    fareType: ["PUBLISHED"],
    includedCheckedBagsOnly: true,
  };

  return [
    {
      type: "flight-offer",
      id: pricedOffer.index,
      source: "ebooking",
      instantTicketingRequired: false,
      nonHomogeneous: false,
      paymentCardRequired: false,
      lastTicketingDate: fareDetails.timeLimits.lastTicketingDate,
      itineraries: [itinerary],
      price,
      pricingOptions,
      validatingAirlineCodes,
      travelerPricings,
    },
  ];
}

/**
 * Build booking requirements from ebooking offer configuration
 */
function buildBookingRequirements(pricedOffer: any) {
  const config = pricedOffer.offerConfiguration || {};

  const travelerRequirements = [
    {
      travelerId: "1",
      genderRequired: config.birthdate?.required || false,
      documentRequired: config.identificationDocument?.required || false,
      dateOfBirthRequired: config.birthdate?.ptcList?.ADT || false,
      redressRequiredIfAny: false,
      residenceRequired: false,
    },
  ];

  return {
    emailAddressRequired: config.contactDetails?.required || true,
    mobilePhoneNumberRequired: config.contactDetails?.required || true,
    travelerRequirements,
  };
}

/**
 * Build dictionaries for locations, carriers, etc.
 */
function buildDictionaries(dataLists: any) {
  const locations: Record<string, any> = {};
  const carriers: Record<string, any> = {};
  const aircraft: Record<string, any> = {};

  // Extract unique locations from segments
  if (dataLists.flightSegmentList) {
    dataLists.flightSegmentList.forEach((segment: any) => {
      // Departure airport
      if (segment.departure?.airport?.code) {
        locations[segment.departure.airport.code] = {
          iataCode: segment.departure.airport.code,
          name: segment.departure.airport.name,
          cityName: segment.departure.city.name,
          countryName: "", // Not available
        };
      }

      // Arrival airport
      if (segment.arrival?.airport?.code) {
        locations[segment.arrival.airport.code] = {
          iataCode: segment.arrival.airport.code,
          name: segment.arrival.airport.name,
          cityName: segment.arrival.city.name,
          countryName: "", // Not available
        };
      }

      // Carriers
      if (segment.marketingCarrier?.airline?.code) {
        carriers[segment.marketingCarrier.airline.code] =
          segment.marketingCarrier.airline.name;
      }

      // Aircraft
      if (segment.equipment?.code) {
        aircraft[segment.equipment.code] = segment.equipment.name || "";
      }
    });
  }

  return {
    locations,
    carriers,
    aircraft,
    currencies: {},
  };
}

/**
 * Build fare rules
 */
function buildFareRules(pricedOffer: any) {
  const rules: Record<string, any> = {};

  pricedOffer.offerItems.forEach((item: any, index: number) => {
    rules[(index + 1).toString()] = {
      fareBasis: item.fareBasis[0] || "",
      name: item.fareBasis[0] || "",
      fareNotes: {
        descriptions: [],
      },
    };
  });

  return rules;
}

/**
 * Build baggage information
 */
function buildBaggageInfo(pricedOffer: any) {
  const bags: Record<string, any> = {};

  pricedOffer.offerItems.forEach((item: any, index: number) => {
    if (item.baggageAllowance) {
      bags[(index + 1).toString()] = item.baggageAllowance;
    }
  });

  return bags;
}

/**
 * Calculate total duration from segments
 */
function calculateTotalDuration(segments: any[]): string {
  if (segments.length === 0) return "PT0M";

  // Simple calculation - sum up durations
  // This is simplified, real calculation would parse durations
  return "PT10M"; // Placeholder
}












