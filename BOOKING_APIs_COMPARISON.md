# Booking APIs Comparison

## 📍 **Two Booking Systems Available**

Your project has **TWO different booking APIs** serving different purposes:

---

## 🆕 **API 1: Unified Booking API** (NEW - Multi-Supplier)

### **Endpoint:**

```
POST /api/v1/booking/create
```

### **Purpose:**

- ✅ Supports **both Amadeus AND ebooking** suppliers
- ✅ Auto-generates **slug-based IDs** (WH-GWT-AG-TES-TKT-00001)
- ✅ Simpler payload structure
- ✅ Direct booking creation (no auth required in validation)

### **Model:** `booking.model.ts`

---

### **Payload Example (ebooking):**

```json
POST http://localhost:5001/api/v1/booking/create
Content-Type: application/json

{
  "supplier": "ebooking",
  "clientRef": "ABC124",
  "availabilityToken": "eyJvZmZlcklkeCI6Ijc4OWNj...",
  "srk": "202a1bf5-bb71-444f-bccb-0e8f253bc81e",
  "offerIndex": "686a25693eb599611154eaec071fcb2e3786c493",
  "wholesalerId": "507f191e810c19729de860ea",
  "agencyId": "507f1f77bcf86cd799439011",
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

### **Response:**

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Flight booking created successfully via ebooking!",
  "data": {
    "bookingId": "WH-GWT-AG-TES-TKT-00001",
    "ticketId": "WH-GWT-AG-TES-TKT-00001",
    "sequenceNumber": 1,
    "pnr": "PNR-WH-GWT-AG-TES-TKT-00001",
    "status": "PENDING",
    "supplier": "ebooking",
    "createdAt": "2025-11-04T12:00:00.000Z",
    "agency": "507f1f77bcf86cd799439011",
    "wholesaler": "507f191e810c19729de860ea",
    "raw": {
      "bookingReference": "WH-GWT-AG-TES-TKT-00001",
      "status": "pending",
      "ebookingRequest": {...}
    }
  }
}
```

### **Features:**

- ✅ Multi-supplier (Amadeus + ebooking)
- ✅ Slug-based IDs with wholesaler/agency
- ✅ No authentication required (can be added)
- ✅ Stores complete supplier response
- ✅ Auto-detects supplier from payload
- ✅ Falls back to simple TKT-XXXXXXXX if no slugs

---

## 🏢 **API 2: Flight Booking API** (EXISTING - Amadeus Only)

### **Endpoint:**

```
POST /api/v1/flight-booking/create
```

### **Purpose:**

- ✅ **Amadeus only** bookings
- ✅ **Requires authentication** (agency_admin or MODERATOR)
- ✅ Supports **main booking relationships** (package bookings)
- ✅ Advanced features (modifications, soft cancellation, reminders)
- ✅ More complex payload structure

### **Model:** `flightBooking.model.ts`

---

### **Payload Example (Amadeus):**

```json
POST http://localhost:5001/api/v1/flight-booking/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "flightOffer": {
    // Complete Amadeus flight offer from pricing API
    "type": "flight-offer",
    "id": "1",
    "source": "GDS",
    "instantTicketingRequired": false,
    "price": {
      "currency": "USD",
      "total": "500.00",
      "base": "450.00",
      "taxes": [{
        "amount": "50.00",
        "code": "US"
      }]
    },
    "itineraries": [
      {
        "duration": "PT8H30M",
        "segments": [
          {
            "departure": {
              "iataCode": "JFK",
              "terminal": "1",
              "at": "2025-11-10T10:00:00"
            },
            "arrival": {
              "iataCode": "LHR",
              "terminal": "5",
              "at": "2025-11-10T22:00:00"
            },
            "carrierCode": "BA",
            "number": "123",
            "aircraft": {
              "code": "777"
            },
            "duration": "PT8H30M"
          }
        ]
      }
    ],
    "travelerPricings": [...]
  },
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
  "contactEmail": "john@smith.com",
  "contactPhone": "12312312345",
  "contactPhoneCountryCode": "+44",
  "address": {
    "lines": ["123 Main St"],
    "postalCode": "12345",
    "cityName": "London",
    "countryCode": "UK"
  },
  "remarks": "Window seat preferred",
  "instantTicketing": true,
  "seatSelections": [
    {
      "segmentId": "1",
      "travelerIds": ["1"],
      "number": "12A"
    }
  ]
}
```

### **Response:**

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Flight booking created successfully!",
  "data": {
    "flightBookingId": "WH-GWT-AG-TES-TKT-00001",
    "sequenceNumber": 1,
    "pnr": "ABC123",
    "amadeusBookingId": "eJzTd9f3...",
    "status": "ticketed",
    "flightType": "ONE_WAY",
    "origin": "JFK",
    "destination": "LHR",
    "departureDate": "2025-11-10T10:00:00.000Z",
    "arrivalDate": "2025-11-10T22:00:00.000Z",
    "passengerCount": {
      "adults": 1,
      "children": 0,
      "infants": 0
    },
    "totalPrice": {
      "value": 500,
      "currency": "USD"
    },
    "ticketingDeadline": "2025-11-17T10:00:00.000Z",
    "ticketNumbers": ["1234567890123"],
    "agency": "507f1f77bcf86cd799439011",
    "wholesaler": "507f191e810c19729de860ea"
  }
}
```

### **Features:**

- ✅ Amadeus-only integration
- ✅ **Authentication required** (JWT token)
- ✅ Main booking relationships (for packages)
- ✅ Slug-based IDs with wholesaler/agency
- ✅ Advanced modification tracking
- ✅ Soft cancellation support
- ✅ Helper methods (getOrigin, getDestination, etc.)
- ✅ Reminder system for ticketing deadlines

---

## 📊 **Comparison Table**

| Feature                   | Unified Booking API            | Flight Booking API                     |
| ------------------------- | ------------------------------ | -------------------------------------- |
| **Endpoint**              | `/api/v1/booking/create`       | `/api/v1/flight-booking/create`        |
| **Suppliers**             | Amadeus + ebooking             | Amadeus only                           |
| **Authentication**        | Optional                       | **Required** (JWT)                     |
| **ID Format**             | `WH-X-AG-Y-TKT-NNNNN`          | `WH-X-AG-Y-TKT-NNNNN`                  |
| **Model**                 | `booking.model.ts`             | `flightBooking.model.ts`               |
| **Main Booking Link**     | ❌ No                          | ✅ Yes                                 |
| **Modification Tracking** | ✅ Basic                       | ✅ Advanced                            |
| **Soft Cancellation**     | ✅ Basic                       | ✅ Advanced                            |
| **Helper Methods**        | ❌ No                          | ✅ Yes                                 |
| **Use Case**              | Simple multi-supplier bookings | Complex Amadeus bookings with packages |

---

## 🎯 **Which API Should You Use?**

### **Use Unified Booking API** (`/api/v1/booking/create`) when:

- ✅ You need **ebooking** support
- ✅ You want **multi-supplier** capability
- ✅ You need a **simpler API**
- ✅ You don't need authentication
- ✅ You don't need package relationships

### **Use Flight Booking API** (`/api/v1/flight-booking/create`) when:

- ✅ You're using **Amadeus only**
- ✅ You need **authentication**
- ✅ You need **package booking** support (flight + hotel + car)
- ✅ You need advanced features (modifications, soft cancellation)
- ✅ You need helper methods (getOrigin, getDestination)

---

## 🔗 **Related Endpoints**

### **Unified Booking API:**

```
POST   /api/v1/booking/create                    - Create booking
POST   /api/v1/booking/:bookingId/issue-ticket   - Issue ticket (delayed ticketing)
```

### **Flight Booking API:**

```
POST   /api/v1/flight-booking/create             - Create flight booking
GET    /api/v1/flight-booking/:id                - Get booking by ID
GET    /api/v1/flight-booking/agency/:agencyId   - Get all bookings for agency
```

---

## 📝 **Quick Reference**

### **Unified Booking API (ebooking example):**

```bash
curl -X POST http://localhost:5001/api/v1/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "supplier": "ebooking",
    "availabilityToken": "eyJ...",
    "srk": "202a1bf5-bb71...",
    "offerIndex": "686a2569...",
    "wholesalerId": "507f191e...",
    "agencyId": "507f1f77...",
    "travelers": [...]
  }'
```

### **Flight Booking API (Amadeus example):**

```bash
curl -X POST http://localhost:5001/api/v1/flight-booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "flightOffer": {...},
    "travelers": [...],
    "contactEmail": "...",
    "contactPhone": "...",
    "contactPhoneCountryCode": "...",
    "address": {...}
  }'
```

---

## 🎉 **Summary**

You now have **TWO powerful booking APIs**:

1. **`/api/v1/booking/create`** - New unified API for **multi-supplier** bookings (Amadeus + ebooking)
2. **`/api/v1/flight-booking/create`** - Existing API for **advanced Amadeus** bookings with package support

Both use **slug-based IDs** and save to the database! 🚀










