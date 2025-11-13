# Unified Booking API Documentation

## Overview

The booking API supports both **Amadeus** and **ebooking** suppliers with a unified interface. The system automatically generates sequential ticket IDs with the format `TKT-XXXXXXXX` and saves all booking data to the database with wholesaler and agency information.

## Endpoint

```
POST /api/v1/booking/create
```

## Features

- ✅ Unified payload structure for both Amadeus and ebooking
- ✅ Automatic supplier detection based on payload
- ✅ Sequential ticket ID generation (`TKT-00000001`, `TKT-00000002`, etc.)
- ✅ Database persistence with wholesaler/agency/subagent IDs
- ✅ Support for all ebooking-specific fields (OSI remarks, seat requests, frequent flyer cards, etc.)
- ✅ Raw supplier response stored for reference
- ✅ Flexible traveler format supporting both suppliers

## Request Payload

### Common Fields (Both Suppliers)

```json
{
  "supplier": "amadeus" | "ebooking" (optional, auto-detected),
  "travelers": [...],
  "contactEmail": "string (optional for ebooking)",
  "contactPhone": "string (optional for ebooking)",
  "contactPhoneCountryCode": "string (optional for ebooking)",
  "address": {...} (optional for ebooking),
  "remarks": "string",
  "instantTicketing": boolean,

  // Auth context (from middleware or request body)
  "wholesalerId": "string",
  "agencyId": "string",
  "subagentId": "string (optional)"
}
```

### Amadeus-Specific Fields

```json
{
  "supplier": "amadeus",
  "flightOffer": {...}, // From pricing confirmation API
  "travelers": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Smith",
      "dateOfBirth": "2001-01-02",
      "gender": "MALE",
      "email": "john@smith.com",
      "phoneCountryCode": "+44",
      "phoneNumber": "12312312345",
      "documentType": "PASSPORT",
      "documentNumber": "333",
      "documentExpiryDate": "2030-01-01",
      "documentIssuanceCountry": "UK",
      "nationality": "UK"
    }
  ],
  "seatSelections": [
    {
      "segmentId": "1",
      "travelerIds": ["1"],
      "number": "12A"
    }
  ],
  "contactEmail": "john@smith.com",
  "contactPhone": "12312312345",
  "contactPhoneCountryCode": "+44",
  "address": {
    "lines": ["123 Main St"],
    "postalCode": "12345",
    "cityName": "London",
    "countryCode": "UK"
  }
}
```

### ebooking-Specific Fields

```json
{
  "supplier": "ebooking",
  "clientRef": "ABC124",
  "availabilityToken": "eyJvZmZlcklkeCI6Ijc4OWNj...",
  "srk": "202a1bf5-bb71-444f-bccb-0e8f253bc81e",
  "offerIndex": "686a25693eb599611154eaec071fcb2e3786c493",
  "travelers": [
    {
      "reference": "1-1",
      "type": "adult",
      "ptc": "ADT",
      "lead": false,
      "title": "mr",
      "firstName": "John",
      "lastName": "Smith",
      "birthDate": "2001-01-02",
      "email": "john@smith.com",
      "phonePrefix": "+44",
      "phone": "12312312345",
      "identificationDocument": {
        "documentType": "passport",
        "number": "333",
        "expiryDate": "2030-01-01",
        "issuingCountry": "UK",
        "issuingDate": "2010-01-01",
        "nationality": "UK"
      }
    },
    {
      "reference": "1-2",
      "type": "adult",
      "ptc": "ADT",
      "lead": true,
      "title": "mr",
      "firstName": "Janet",
      "lastName": "Smith",
      "birthDate": "2002-01-02",
      "email": "janet@smith.com",
      "phonePrefix": "+44",
      "phone": "1111111111",
      "identificationDocument": {
        "documentType": "passport",
        "number": "333",
        "expiryDate": "2030-01-01",
        "issuingCountry": "UK",
        "issuingDate": "2010-01-01",
        "nationality": "UK"
      }
    }
  ],
  "OSIRemarks": [
    {
      "airlineCode": "AF",
      "text": "Sample remark text"
    }
  ],
  "seatRequests": [
    {
      "paxReference": "1-1",
      "preference": "A"
    }
  ],
  "frequentTravellerCards": [
    {
      "paxReference": "1-1",
      "airlineCode": "AF",
      "number": "123",
      "expiryDate": "2023-11-12",
      "issuingDate": "2020-10-10"
    }
  ],
  "backOfficeRemarks": [
    {
      "id": 107,
      "text": "Sample remark text"
    },
    {
      "id": 108,
      "text": "Sample remark text"
    }
  ],
  "comments": "Sample extra comment",
  "priceModifiers": {
    "markup": {
      "value": 10,
      "currency": "EUR"
    },
    "commission": {
      "value": 111111,
      "currency": "EUR"
    }
  }
}
```

## Response

### Success Response (200)

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Flight booking created successfully via ebooking!",
  "data": {
    "bookingId": "TKT-00000001",
    "ticketId": "TKT-00000001",
    "pnr": "ABC123",
    "status": "CONFIRMED",
    "supplier": "ebooking",
    "createdAt": "2025-11-04T12:00:00.000Z",
    "ticketingDeadline": "2025-11-10T12:00:00.000Z",
    "eTicketNumber": "1234567890123",
    "travelers": [...],
    "seatSelections": [...],
    "raw": {...}, // Raw supplier response
    "agency": "507f1f77bcf86cd799439011",
    "wholesaler": "507f191e810c19729de860ea",
    "subagent": "507f191e810c19729de860eb"
  }
}
```

## Database Schema

The booking is saved with the following structure:

```javascript
{
  bookingId: "TKT-00000001", // Sequential ticket ID
  ticketId: "TKT-00000001", // Alias for bookingId
  sequenceNumber: 1, // Numeric sequence
  pnr: "ABC123", // Supplier PNR or booking reference
  supplier: "ebooking", // "amadeus" or "ebooking"
  amadeusBookingId: "...", // For Amadeus bookings
  ebookingBookingReference: "...", // For ebooking bookings
  status: "confirmed", // pending, confirmed, ticketed, cancelled, failed, expired
  agency: ObjectId("..."),
  wholesaler: ObjectId("..."),
  subagent: ObjectId("..."),
  passengers: [...],
  itineraries: [...],
  contact: {...},
  priceDetails: {...},
  seatSelections: [...],
  flightOfferData: {...}, // Original flight offer
  supplierResponseData: {...}, // Raw supplier response
  createdAt: Date,
  updatedAt: Date
}
```

## Ticket ID Generation

- **Format**: `TKT-XXXXXXXX` (8-digit zero-padded sequence)
- **Examples**: `TKT-00000001`, `TKT-00000002`, `TKT-00000123`
- **Sequential**: Auto-increments based on last booking in database
- **Unique**: Enforced by database unique index

## Supplier Detection

The API automatically detects the supplier based on the payload:

1. If `supplier` field is provided, it uses that value
2. If `availabilityToken` is present, it detects as "ebooking"
3. Otherwise, defaults to "amadeus"

## Required Fields by Supplier

### Amadeus

- `flightOffer` (from pricing API)
- `travelers` with `id`, `dateOfBirth`, `gender`
- `contactEmail`, `contactPhone`, `contactPhoneCountryCode`
- `address` (full address object)

### ebooking

- `availabilityToken` (from pricing/availability API)
- `srk` (search results key)
- `offerIndex` (offer index)
- `travelers` with `reference`, `type`, `ptc`, `birthDate`
- Optional: OSI remarks, seat requests, frequent flyer cards, etc.

## Error Handling

### 400 Bad Request

```json
{
  "success": false,
  "message": "Missing required ebooking booking parameters: srk and offerIndex",
  "errorMessages": [...]
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Flight offer not found or no longer available",
  "errorMessages": [...]
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Flight price has changed or seats are no longer available",
  "errorMessages": [...]
}
```

## Usage Example

### ebooking Booking Flow

```javascript
// 1. Search flights
POST /api/v1/price-list
{
  "originLocationCode": "DAC",
  "destinationLocationCode": "DXB",
  "departureDate": "2025-11-10",
  "adults": 2,
  "supplier": "ebooking"
}

// 2. Get pricing confirmation
POST /api/v1/price-list/pricing
{
  "supplier": "ebooking",
  "srk": "202a1bf5-bb71-444f-bccb-0e8f253bc81e",
  "offerIndex": "686a25693eb599611154eaec071fcb2e3786c493",
  "itineraryIndex": 0,
  "token": "03a84264..."
}

// Response includes availabilityToken

// 3. Create booking
POST /api/v1/booking/create
{
  "clientRef": "ABC124",
  "availabilityToken": "eyJvZmZlcklkeCI6...",
  "srk": "202a1bf5-bb71-444f-bccb-0e8f253bc81e",
  "offerIndex": "686a25693eb599611154eaec071fcb2e3786c493",
  "travelers": [...],
  "OSIRemarks": [...],
  "seatRequests": [...],
  "frequentTravellerCards": [...],
  "backOfficeRemarks": [...],
  "comments": "Sample comment",
  "priceModifiers": {...},
  "wholesalerId": "507f191e810c19729de860ea",
  "agencyId": "507f1f77bcf86cd799439011"
}

// Response includes TKT-00000001 ticket ID
```

## Notes

- ✅ **No 3rd Party API Call Required**: Currently, the ebooking booking endpoint is not called. The payload is prepared and saved to the database only.
- ✅ **Flexible Traveler Format**: Supports both Amadeus (`id`, `dateOfBirth`, `gender`) and ebooking (`reference`, `birthDate`, `type`, `ptc`) formats.
- ✅ **Auth Context**: Wholesaler, agency, and subagent IDs can be passed from auth middleware or in the request body.
- ✅ **Raw Data Stored**: Complete supplier response is stored in `supplierResponseData` for reference.
- ✅ **Seat Selections**: Supports both Amadeus (`segmentId`, `travelerIds`, `number`) and ebooking (`paxReference`, `preference`) formats.









