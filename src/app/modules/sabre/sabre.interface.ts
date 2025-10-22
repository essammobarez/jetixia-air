export interface SabreFlightSearchRequest {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    cabinClass?: 'Economy' | 'Premium' | 'Business' | 'First';
    maxResults?: number;
}

export interface SabreFlightSearchResponse {
    success: boolean;
    data?: {
        flights: SabreFlight[];
        searchId?: string;
        currency: string;
        totalResults: number;
    };
    error?: string;
}

export interface SabreFlight {
    id: string;
    price: {
        total: number;
        base: number;
        taxes: number;
        currency: string;
    };
    itineraries: SabreItinerary[];
    validatingCarrier: string;
    lastTicketingDate?: string;
}

export interface SabreItinerary {
    direction: 'outbound' | 'inbound';
    segments: SabreSegment[];
    duration: string;
}

export interface SabreSegment {
    departure: {
        airport: string;
        terminal?: string;
        time: string;
    };
    arrival: {
        airport: string;
        terminal?: string;
        time: string;
    };
    carrier: string;
    flightNumber: string;
    aircraft: string;
    duration: string;
    cabinClass: string;
    bookingClass: string;
}

export interface SabreTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}