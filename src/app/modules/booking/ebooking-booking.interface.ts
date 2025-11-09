// ebooking Booking API Interfaces

export interface EbookingBookingTraveler {
  reference: string; // e.g., "1-1", "1-2"
  type: "adult" | "child" | "infant";
  ptc: string; // ADT, CHD, INF
  lead: boolean;
  title: string; // mr, mrs, ms, etc.
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  email: string;
  phonePrefix: string; // e.g., "+44"
  phone: string;
  identificationDocument?: {
    documentType: string; // passport, identity_card
    number: string;
    expiryDate: string; // YYYY-MM-DD
    issuingCountry: string; // ISO country code
    issuingDate?: string; // YYYY-MM-DD
    nationality: string; // ISO country code
  };
}

export interface EbookingOSIRemark {
  airlineCode: string;
  text: string;
}

export interface EbookingSeatRequest {
  paxReference: string; // e.g., "1-1"
  preference: string; // A = aisle, W = window, etc.
}

export interface EbookingFrequentTravellerCard {
  paxReference: string;
  airlineCode: string;
  number: string;
  expiryDate?: string;
  issuingDate?: string;
}

export interface EbookingBackOfficeRemark {
  id: number;
  text: string;
}

export interface EbookingPriceModifiers {
  markup?: {
    value: number;
    currency: string;
  };
  commission?: {
    value: number;
    currency: string;
  };
}

export interface EbookingBookingRequest {
  clientRef: string; // Client reference for tracking
  availabilityToken: string; // From availability/pricing API
  travelers: EbookingBookingTraveler[];
  OSIRemarks?: EbookingOSIRemark[];
  seatRequests?: EbookingSeatRequest[];
  frequentTravellerCards?: EbookingFrequentTravellerCard[];
  backOfficeRemarks?: EbookingBackOfficeRemark[];
  comments?: string;
  priceModifiers?: EbookingPriceModifiers;
}

export interface EbookingBookingResponse {
  bookingReference: string; // ebooking booking reference (PNR-like)
  status: string;
  pnr?: string;
  ticketNumbers?: string[];
  flightDetails?: any;
  travelers?: any;
  priceBreakdown?: any;
  _links?: {
    self?: { href: string };
    ticketing?: { href: string };
  };
  // Raw response structure (flexible)
  [key: string]: any;
}





