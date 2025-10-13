export interface FlightOfferPricingRequest {
  flightOffers: any[]; // Flexible array - comes from previous price-list API
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
}
