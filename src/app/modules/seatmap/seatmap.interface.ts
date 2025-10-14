export interface SeatMapRequest {
  flightOffers: any[]; // Flight offers from pricing confirmation API
}

export interface SeatCharacteristics {
  code: string;
  description: string;
}

export interface SeatPrice {
  currency: string;
  total: string;
}

export interface TravelerPricing {
  travelerId: string;
  seatAvailabilityStatus: "AVAILABLE" | "OCCUPIED" | "BLOCKED";
  price?: SeatPrice;
}

export interface Seat {
  cabin: string;
  number: string;
  characteristicsCodes: string[];
  travelerPricing: TravelerPricing[];
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface Deck {
  deckType: string;
  deckConfiguration: {
    width: number;
    length: number;
    startSeatRow: number;
    endSeatRow: number;
    startWing?: number;
    endWing?: number;
    exitRowsX?: number[];
  };
  facilities?: any[];
  seats: Seat[];
}

export interface SeatMap {
  type: string;
  flightOfferId: string;
  segmentId: string;
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  departure: {
    iataCode: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    at: string;
  };
  class: string;
  deckConfiguration?: any;
  decks: Deck[];
}

export interface SeatMapResponse {
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  data: SeatMap[];
  dictionaries?: any;
}
