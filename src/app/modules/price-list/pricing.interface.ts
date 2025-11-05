export interface FlightOfferPricingRequest {
  supplier?: "amadeus" | "ebooking"; // Optional supplier indication
  flightOffers?: any[]; // For Amadeus - comes from previous price-list API
  // For ebooking
  srk?: string;
  offerIndex?: string;
  itineraryIndex?: number;
  token?: string;
  wholesalerId?: string;
}

export interface FlightOfferPricingResponse {
  data: {
    type: string;
    flightOffers: any[];
    bookingRequirements?: any;
  };
  included?: {
    "detailed-fare-rules"?: Record<string, any>;
    bags?: Record<string, any>;
    "other-services"?: Record<string, any>;
    "credit-card-fees"?: Record<string, any>;
  };
  dictionaries?: {
    locations?: Record<string, any>;
    aircraft?: Record<string, any>;
    currencies?: Record<string, any>;
    carriers?: Record<string, any>;
  };
  // Raw supplier response
  raw?: any;
  supplier?: "amadeus" | "ebooking";
}
