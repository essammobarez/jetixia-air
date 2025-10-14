export interface TicketingRequest {
  bookingId: string; // Amadeus flight order ID
}

export interface TicketingResponse {
  success: boolean;
  bookingId: string;
  pnr: string;
  status: string; // "TICKETED"
  eTicketNumber?: string;
  ticketingAgreement: any;
  associatedRecords: any[];
}
