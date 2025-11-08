export interface Traveler {
  id?: string; // For Amadeus
  reference?: string; // For ebooking (e.g., "1-1", "1-2")
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  birthDate?: string; // For ebooking compatibility (YYYY-MM-DD)
  gender?: "MALE" | "FEMALE"; // For Amadeus
  type?: "adult" | "child" | "infant"; // For ebooking
  ptc?: string; // Passenger Type Code for ebooking (ADT, CHD, INF)
  lead?: boolean; // For ebooking
  title?: string; // mr, mrs, ms, etc. for ebooking
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  phonePrefix?: string; // For ebooking
  phone?: string; // For ebooking
  documentType?: "PASSPORT" | "IDENTITY_CARD" | "passport" | "identity_card";
  documentNumber?: string;
  documentExpiryDate?: string; // YYYY-MM-DD
  documentIssuanceCountry?: string;
  documentIssuanceDate?: string; // YYYY-MM-DD
  nationality?: string;
  birthPlace?: string;
  issuanceLocation?: string;
  issuingCountry?: string; // For ebooking
  expiryDate?: string; // For ebooking document
  number?: string; // For ebooking document number
  associatedAdultId?: string; // For infants
  identificationDocument?: {
    documentType: string;
    number: string;
    expiryDate: string;
    issuingCountry: string;
    issuingDate?: string;
    nationality: string;
  };
}

export interface ContactAddress {
  lines: string[];
  postalCode: string;
  cityName: string;
  countryCode: string;
}

export interface SeatSelection {
  segmentId?: string; // For Amadeus
  travelerIds?: string[]; // For Amadeus
  paxReference?: string; // For ebooking (e.g., "1-1")
  preference?: string; // For ebooking (e.g., "A" for aisle)
  number?: string; // Seat number like "12A", "15F" (for Amadeus)
}

export interface FrequentTravellerCard {
  paxReference: string;
  airlineCode: string;
  number: string;
  expiryDate?: string;
  issuingDate?: string;
}

export interface OSIRemark {
  airlineCode: string;
  text: string;
}

export interface BackOfficeRemark {
  id: number;
  text: string;
}

export interface PriceModifiers {
  markup?: {
    value: number;
    currency: string;
  };
  commission?: {
    value: number;
    currency: string;
  };
}

export interface BookingRequest {
  supplier?: "amadeus" | "ebooking"; // Supplier indication

  // Common fields
  flightOffer?: any; // From pricing confirmation API - for Amadeus
  travelers: Traveler[];
  contactEmail?: string;
  contactPhone?: string;
  contactPhoneCountryCode?: string;
  address?: ContactAddress;
  remarks?: string;
  instantTicketing?: boolean; // true = immediate ticket, false = delayed (6 days)
  seatSelections?: SeatSelection[]; // Optional seat selections

  // ebooking specific fields
  clientRef?: string; // Client reference for ebooking
  availabilityToken?: string; // From ebooking availability/pricing API
  OSIRemarks?: OSIRemark[]; // Other Service Information remarks
  seatRequests?: SeatSelection[]; // For ebooking seat preferences
  frequentTravellerCards?: FrequentTravellerCard[];
  backOfficeRemarks?: BackOfficeRemark[];
  comments?: string; // Additional comments for ebooking
  priceModifiers?: PriceModifiers; // Price modifiers (markup/commission)

  // Auth context (from middleware)
  wholesalerId?: string;
  agencyId?: string;
  subagentId?: string;

  // Metadata - Flexible field for additional custom data
  meta?: Record<string, any>;
}

export interface BookingResponse {
  bookingId: string; // Our internal booking ID (TKT-XXXXXXXX)
  ticketId: string; // Alias for bookingId
  pnr?: string; // Amadeus PNR or ebooking booking reference
  status: string;
  supplier: "amadeus" | "ebooking";
  createdAt: string;
  ticketingDeadline?: string;
  ticketingOption?: string; // "CONFIRM" or "DELAY_TO_CANCEL"
  eTicketNumber?: string;
  queuingOfficeId?: string;
  automatedProcess?: any[];
  flightOffers?: any[];
  travelers: any[];
  contacts?: any[];
  ticketingAgreement?: any;
  seatSelections?: SeatSelection[];
  raw?: any; // Raw supplier response

  // Database fields
  agency?: string;
  wholesaler?: string;
  subagent?: string;

  // Metadata
  meta?: Record<string, any>;
}
