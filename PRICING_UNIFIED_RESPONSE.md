# Unified Pricing/Confirmation Response Analysis

This document analyzes the common elements between **Amadeus** and **eBooking** pricing/confirmation APIs to create a unified response structure.

## 📊 Common Elements

### 1. **Segments/Itineraries**

Both APIs return:

- **Departure/Arrival Details**: airports, terminals, times, dates
- **Airline Information**: carrier codes, names, flight numbers
- **Aircraft Information**: aircraft type
- **Duration**: flight duration
- **Stops**: number of stops

### 2. **Pricing Information**

- **Total Price**: final price including taxes
- **Base Fare**: base fare excluding taxes
- **Taxes**: breakdown of individual taxes
- **Fees**: various fees (SUPPLIER, TICKETING, etc.)
- **Currency**: price currency

### 3. **Booking Requirements**

- **Email Required**: boolean
- **Phone Required**: boolean
- **Traveler Requirements**: per traveler
  - Gender required
  - Document required
  - Date of birth required
  - Redress required
  - Residence required

### 4. **Fare Details**

- **Fare Basis**: fare code
- **Cabin**: class of service
- **Baggage**: checked/carry-on baggage allowance
- **Refundable**: whether ticket is refundable
- **Changeable**: whether ticket can be changed

### 5. **Additional Data (Dictionaries)**

- **Locations**: airport/city/country mapping
- **Aircraft**: aircraft type mapping
- **Carriers**: airline information

### 6. **Warnings** (ebooking only)

- Code, title, detail, status

## 🔄 Mapping Overview

### Amadeus Response Structure:

```json
{
  "warnings": [],
  "data": {
    "type": "flight-offers-pricing",
    "flightOffers": [...],
    "bookingRequirements": {...},
    "dictionaries": {...}
  },
  "included": {
    "detailed-fare-rules": {...},
    "credit-card-fees": {...}
  }
}
```

### eBooking Response Structure:

```json
{
  "availabilityToken": "...",
  "srk": "...",
  "pricedOffer": {...},
  "dataLists": {...},
  "_links": {...}
}
```

## 💡 Recommendation for Unified Response

Create a unified response structure that includes:

### Core Response Structure

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Flight pricing confirmed successfully!",
  "data": {
    "supplier": "amadeus" | "ebooking",
    "warnings": [...],  // ebooking-specific
    "token": "...",     // ebooking-specific
    "bookingRequirements": {
      "emailAddressRequired": boolean,
      "mobilePhoneNumberRequired": boolean,
      "travelerRequirements": [...]
    },
    "flightOffers": [...],  // normalized segment structure
    "pricingDetails": {
      "totalPrice": {...},
      "baseFare": {...},
      "taxes": [...],
      "fees": [...]
    },
    "fareRules": {...},  // detailed fare rules
    "dictionaries": {...},  // locations, aircraft, carriers
    "meta": {
      "offerExpiration": "...",
      "ticketingTimeLimit": "...",
      "lastTicketingDate": "..."
    },
    "raw": {...}  // original supplier response
  }
}
```

## 📋 Implementation Strategy

Since ebooking uses a different confirmation flow (availability API vs Amadeus pricing API), we need to:

1. **Normalize Segments**: Convert ebooking's `flightSegmentList` to Amadeus-style `segments[]`
2. **Map Booking Requirements**: Transform ebooking's `offerConfiguration` to Amadeus-style `bookingRequirements`
3. **Extract Pricing**: Get price breakdown from ebooking's `pricedOffer.fareDetails`
4. **Preserve Raw Data**: Keep original response in `raw` field
5. **Add Dictionaries**: Expand ebooking's `dataLists` into Amadeus-style `dictionaries`

## ✅ Key Points

- **Both suppliers return similar data**, just in different structures
- **ebooking has availability API** (different from Amadeus pricing API)
- **Need transformer** to convert ebooking response to unified format
- **Keep original responses** in `raw` field for advanced use cases
- **Frontend can consume unified structure** without knowing supplier
