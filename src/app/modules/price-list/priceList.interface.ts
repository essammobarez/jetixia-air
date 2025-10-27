export interface FlightOfferQuery {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  nonStop?: boolean;
  max?: number;
  supplier?: "amadeus" | "ebooking" | "both";
}

export interface AirlineInfo {
  iataCode: string;
  icaoCode: string;
  businessName: string;
  commonName: string;
}

export interface AirportInfo {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
  countryCode: string;
}

export interface Segment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
    airportName?: string;
    cityName?: string;
    countryName?: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
    airportName?: string;
    cityName?: string;
    countryName?: string;
  };
  carrierCode: string;
  carrierName?: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating: {
    carrierCode: string;
    carrierName?: string;
  };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  fees?: Array<{
    amount: string;
    type: string;
  }>;
  grandTotal: string;
}

export interface FlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  isUpsellOffer: boolean;
  lastTicketingDate: string;
  lastTicketingDateTime: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: any[];
}

export interface AmadeusFlightOffersResponse {
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  data: FlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
  };
}
