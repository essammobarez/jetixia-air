export interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: "MALE" | "FEMALE";
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  documentType?: "PASSPORT" | "IDENTITY_CARD";
  documentNumber?: string;
  documentExpiryDate?: string; // YYYY-MM-DD
  documentIssuanceCountry?: string;
  documentIssuanceDate?: string; // YYYY-MM-DD
  nationality?: string;
  birthPlace?: string;
  issuanceLocation?: string;
  associatedAdultId?: string; // For infants
}

export interface ContactAddress {
  lines: string[];
  postalCode: string;
  cityName: string;
  countryCode: string;
}

export interface SeatSelection {
  segmentId: string;
  travelerIds: string[];
  number: string; // Seat number like "12A", "15F"
}

export interface BookingRequest {
  flightOffer: any; // From pricing confirmation API - flexible structure
  travelers: Traveler[];
  contactEmail: string;
  contactPhone: string;
  contactPhoneCountryCode: string;
  address: ContactAddress;
  remarks?: string;
  instantTicketing?: boolean; // true = immediate ticket, false = delayed (6 days)
  seatSelections?: SeatSelection[]; // Optional seat selections
}

export interface BookingResponse {
  bookingId: string;
  pnr: string;
  status: string;
  createdAt: string;
  ticketingDeadline?: string;
  ticketingOption?: string; // "CONFIRM" or "DELAY_TO_CANCEL"
  eTicketNumber?: string;
  queuingOfficeId?: string;
  automatedProcess?: any[];
  flightOffers: any[];
  travelers: any[];
  contacts: any[];
  ticketingAgreement?: any;
  seatSelections?: SeatSelection[]; // Seat selections from request (Amadeus doesn't return these)
}
