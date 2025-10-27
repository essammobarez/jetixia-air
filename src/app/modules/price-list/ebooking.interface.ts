// ebooking API Interfaces

export interface EbookingAuthRequest {
  grant_type: string;
  client_id: string;
  client_secret: string;
  scope: string;
}

export interface EbookingAuthResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
}

export interface EbookingOriginDestination {
  origin: {
    code: string;
  };
  destination: {
    code: string;
  };
  date: string;
}

export interface EbookingPassengerType {
  ptc: "ADT" | "CHD" | "INF";
  count: number;
}

export interface EbookingPassengers {
  leaderNationality: number;
  ptcList: EbookingPassengerType[];
}

export interface EbookingSearchRequest {
  originDestinations: EbookingOriginDestination[];
  passengers: EbookingPassengers;
  sellingChannel: "B2B" | "B2C";
  language: string;
  timeout: number;
}

export interface EbookingDataLists {
  flightList?: EbookingFlightList[];
  flightSegmentList?: EbookingFlightSegment[];
}

export interface EbookingFlightList {
  key: string;
  segmentReferences: string[];
  flightDetails: {
    duration: string;
  };
  stops: Array<{
    stopTime: string;
  }>;
}

export interface EbookingFlightSegment {
  index: number;
  key: string;
  routeIndex: string | null;
  secured: boolean | null;
  departure: {
    airport: {
      code: string;
      name: string;
    };
    city: {
      code: string;
      name: string;
    };
    date: string;
    time: string;
    terminal: string;
  };
  arrival: {
    airport: {
      code: string;
      name: string;
    };
    city: {
      code: string;
      name: string;
    };
    date: string;
    time: string;
    terminal: string;
  };
  marketingCarrier: {
    airline: {
      code: string;
      name: string;
    };
    flightNumber: number;
  };
  operatingCarrier: {
    airline: {
      code: string;
      name: string;
    };
    flightNumber: number | null;
  };
  equipment: {
    code: string;
    name: string | null;
  };
  flightDetails: {
    duration: string | null;
  };
}

export interface EbookingSearchResponse {
  offers: any[];
  dataLists: EbookingDataLists;
  srk: string;
  tokens: {
    searchResults: string;
  };
  _links: {
    self: {
      href: string;
    };
  };
}

export interface EbookingResultsResponse {
  pages: {
    current: number;
    total: number;
    itemsPerPage: number;
  };
  offers: EbookingFlightOffer[];
  dataLists: any[];
  srk: string;
  tokens: {
    searchResults: string;
  };
  _links: {
    self: {
      href: string;
    };
  };
}

export interface EbookingResultsRequest {
  srk: string;
  token: string;
  page?: number;
  perPage?: number;
  sortField?: "price" | "preferredPriority";
  sortOrder?: "ASC" | "DESC";
  dates?: string[];
  stops?: number;
  carriers?: string[];
  fareBasisCodes?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface EbookingFlightDetails {
  flightReference: string;
  departure: {
    airport: string;
    terminal?: string;
    time: string;
    date: string;
    city?: string;
    airportName?: string;
  };
  arrival: {
    airport: string;
    terminal?: string;
    time: string;
    date: string;
    city?: string;
    airportName?: string;
  };
  airline: {
    code: string;
    name: string;
  };
  operatingAirline?: string;
  flightNumber: string;
  aircraft: string;
  equipmentName?: string | null;
  duration: string;
  stops: number;
}

export interface EbookingFlightOffer {
  // Flexible interface to handle actual ebooking response structure
  [key: string]: any;
}

export interface EbookingItinerary {
  duration: string;
  segments: EbookingSegment[];
}

export interface EbookingSegment {
  departure: {
    code: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    code: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  duration: string;
  numberOfStops: number;
}

// Simplified interfaces for UI consumption
export interface SimplifiedFlightOffer {
  id: string;
  supplier: "amadeus" | "ebooking";
  price: {
    currency: string;
    total: string;
    base: string;
  };
  duration: string;
  segments: SimplifiedSegment[];
  airline: {
    code: string;
    name: string;
  };
  stops: number;
  departure: {
    airport: string;
    city: string;
    country: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    time: string;
    date: string;
  };
  // Additional metadata (optional, supplier-specific)
  metadata?: {
    cabin?: string;
    serviceFee?: number;
    isRefundable?: boolean;
    isAutoTicketable?: boolean;
    fareBasis?: string;
    offerExpiration?: string;
    ticketingTimeLimit?: string;
    [key: string]: any;
  };
  // Raw object for API compatibility
  raw: any;
}

export interface SimplifiedSegment {
  departure: {
    airport: string;
    city: string;
    country: string;
    time: string;
    date: string;
    terminal?: string;
    airportName?: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    time: string;
    date: string;
    terminal?: string;
    airportName?: string;
  };
  airline: {
    code: string;
    name: string;
  };
  operatingAirline?: string;
  flightNumber: string;
  aircraft: string;
  equipmentName?: string | null;
  duration: string;
  stops: number;
}

// Multi-supplier response structure
export interface MultiSupplierResponse {
  raw: {
    amadeus?: any;
    ebooking?: any;
  };
  simplified: {
    amadeus: SimplifiedFlightOffer[];
    ebooking: SimplifiedFlightOffer[];
    combined: SimplifiedFlightOffer[];
  };
  meta: {
    totalCount: number;
    suppliers: string[];
    searchTime: string;
    errors?: {
      amadeus?: string;
      ebooking?: string;
    };
  };
}
