# ✈️ Flight Booking Integration Plan

## 📋 Overview

This document outlines the plan to integrate Amadeus flight bookings with your existing hotel booking system, maintaining backward compatibility with existing data.

---

## 🎯 Goals

1. ✅ Create standalone flight booking system
2. ✅ Allow multiple flights in one booking
3. ✅ Link flights to existing hotel bookings
4. ✅ Retrieve data in chronological order (by service date)
5. ✅ Keep existing hotel booking data untouched
6. ✅ Zero downtime deployment

---

## 🏗️ Architecture Design

### **Two-Collection Approach**

```
┌─────────────────────────────────────────────────────────────┐
│                    Booking (Parent)                          │
│  - bookingId: "BK-2025-0001"                                │
│  - agency, wholesaler, subagent                             │
│  - bookingVersion: "v1" or "v2"                             │
│                                                              │
│  V1 (Existing):                                             │
│  - rooms: [...] (hotel data embedded)                       │
│                                                              │
│  V2 (New):                                                  │
│  - services: [                                              │
│      { serviceType: "HOTEL", hotelData: {...} },           │
│      { serviceType: "FLIGHT", flightBooking: ObjectId }    │
│    ]                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ References
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FlightBooking (Separate Collection)            │
│  - _id: ObjectId                                            │
│  - flightBookingId: "FLT-2025-0001"                        │
│  - pnr: "ABC123" (Amadeus PNR)                             │
│  - amadeusBookingId: "eJzTd9f..."                          │
│  - mainBooking: ObjectId (optional link to parent)         │
│  - itineraries: [                                           │
│      { segments: [...] },  // Flight 1                     │
│      { segments: [...] }   // Flight 2                     │
│    ]                                                         │
│  - passengers: [...]                                        │
│  - totalPrice: {...}                                        │
│  - ticketing info, seat selections, etc.                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/app/modules/booking/
├── booking.model.ts                 # Existing (Hotel bookings - keep as-is for now)
├── flightBooking.model.ts          # NEW - Complete flight booking model
├── booking.interface.ts            # Existing (Flight interfaces already there)
├── booking.service.ts              # Existing (Amadeus API integration)
├── booking.controller.ts           # Existing
├── booking.route.ts                # Existing
├── booking.validation.ts           # Existing
├── flightBooking.service.ts        # NEW - Flight-specific operations
├── flightBooking.controller.ts     # NEW - Flight CRUD operations
├── flightBooking.route.ts          # NEW - Flight API routes
└── README.md                        # Existing
```

---

## 🗄️ FlightBooking Model Schema

### **Core Fields**

```typescript
FlightBooking {
  // Identifiers
  _id: ObjectId,
  flightBookingId: String,        // "FLT-2025-0001" (Sequential)
  sequenceNumber: Number,         // Auto-increment

  // Amadeus References
  pnr: String,                    // "ABC123" (from Amadeus)
  amadeusBookingId: String,       // "eJzTd9f..." (from Amadeus)

  // Link to Main Booking (Optional)
  mainBooking: ObjectId,          // Reference to Booking collection
  mainBookingId: String,          // "BK-2025-0001"
  isStandalone: Boolean,          // true if not linked to main booking

  // Flight Type
  flightType: String,             // "ONE_WAY", "ROUND_TRIP", "MULTI_CITY"

  // Itineraries (Multiple flights in one booking)
  itineraries: [{
    duration: String,             // "PT7H30M"
    segments: [{
      segmentId: String,
      departure: {
        iataCode: String,         // "JFK"
        terminal: String,
        at: String                // ISO DateTime
      },
      arrival: {
        iataCode: String,         // "LHR"
        terminal: String,
        at: String
      },
      carrierCode: String,        // "BA"
      flightNumber: String,       // "117"
      aircraft: String,
      operating: {
        carrierCode: String
      },
      duration: String,
      numberOfStops: Number,
      blacklistedInEU: Boolean
    }]
  }],

  // Passengers
  passengers: [{
    travelerId: String,
    firstName: String,
    lastName: String,
    dateOfBirth: String,
    gender: String,
    email: String,
    phone: String,
    documentType: String,
    documentNumber: String,
    documentExpiryDate: String,
    nationality: String,
    // ... more passenger fields
  }],

  passengerCount: {
    adults: Number,
    children: Number,
    infants: Number
  },

  // Contact Information
  contact: {
    email: String,
    phone: String,
    phoneCountryCode: String,
    address: {
      lines: [String],
      postalCode: String,
      cityName: String,
      countryCode: String
    }
  },

  // Pricing
  priceDetails: {
    price: { value: Number, currency: String },
    originalPrice: { value: Number, currency: String },
    baseFare: { value: Number, currency: String },
    taxes: { value: Number, currency: String },
    fees: { value: Number, currency: String },
    markupApplied: {
      type: String,
      value: Number,
      description: String
    }
  },

  totalPrice: {
    value: Number,
    currency: String
  },

  // Ticketing
  ticketingAgreement: {
    option: String,               // "CONFIRM", "DELAY_TO_CANCEL"
    delay: String,                // "6D"
    dateTime: Date                // Ticketing deadline
  },

  ticketingDeadline: Date,
  ticketNumbers: [String],        // e-Ticket numbers (13 digits)
  instantTicketing: Boolean,

  // Optional Services
  seatSelections: [{
    segmentId: String,
    travelerIds: [String],
    number: String                // "12A"
  }],

  baggageAllowance: {
    checkedBags: {
      quantity: Number,
      weight: Number,
      weightUnit: String
    },
    cabinBags: {
      quantity: Number,
      weight: Number,
      weightUnit: String
    }
  },

  // Status
  status: String,                 // "pending", "confirmed", "ticketed", "cancelled"

  // Agency References
  agency: ObjectId,
  wholesaler: ObjectId,
  subagent: ObjectId,

  // Booking Configuration
  bookingType: String,            // "PAYLATER", "CREDIT", "PAYNOW"
  paymentMethod: String,          // "AGENT_CARD", "CREDIT"

  // Payments
  payments: [{
    paymentIntentId: String,
    amount: Number,
    currency: String,
    paymentMethod: String,
    status: String,
    createdAt: Date
  }],

  // Additional Info
  remarks: String,
  queuingOfficeId: String,
  automatedProcess: [Object],

  // Raw Data Storage (Complete Amadeus Response)
  flightOfferData: Object,        // Complete flight offer from search
  amadeusResponseData: Object,    // Complete booking response from Amadeus

  // Support
  supportTickets: [ObjectId],

  // Modification
  modified: Boolean,
  modificationDetails: {
    price: Number,
    markup: Number,
    modifiedAt: Date,
    reason: String
  },

  // Soft Cancellation
  softCancelled: Boolean,
  softCancelledForAgency: Boolean,
  softCancelledForWholesaler: Boolean,
  lastReminderSentAt: {
    agency: Date,
    wholesaler: Date
  },

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Usage Scenarios

### **Scenario 1: Standalone Flight Booking**

```javascript
// User books flight only
POST /api/v1/flight-booking/create
Body: {
  flightOffer: {...},
  travelers: [...],
  contactEmail: "john@example.com",
  agency: "agency_id",
  wholesaler: "wholesaler_id"
}

// Creates:
FlightBooking {
  flightBookingId: "FLT-2025-0001",
  pnr: "ABC123",
  isStandalone: true,
  mainBooking: null,
  // ... flight data
}
```

### **Scenario 2: Flight with Existing Hotel Booking**

```javascript
// Step 1: User has existing hotel booking
Booking {
  bookingId: "BK-2025-0001",
  rooms: [{ hotel: "Marriott", ... }]
}

// Step 2: Add flight to booking
POST /api/v1/booking/BK-2025-0001/add-flight
Body: {
  flightOffer: {...},
  travelers: [...]
}

// Creates:
FlightBooking {
  flightBookingId: "FLT-2025-0002",
  pnr: "DEF456",
  isStandalone: false,
  mainBooking: ObjectId("..."),
  mainBookingId: "BK-2025-0001"
}

// Updates main booking:
Booking {
  bookingId: "BK-2025-0001",
  bookingVersion: "v2",  // Upgraded!
  services: [
    { serviceType: "HOTEL", hotelData: {...} },
    { serviceType: "FLIGHT", flightBooking: ObjectId("...") }
  ]
}
```

### **Scenario 3: Multiple Flights in One FlightBooking**

```javascript
// User books multi-city trip
POST /api/v1/flight-booking/create
Body: {
  flightOffer: {
    itineraries: [
      { segments: [{ /* NYC → LON */ }] },
      { segments: [{ /* LON → PAR */ }] },
      { segments: [{ /* PAR → NYC */ }] }
    ]
  },
  travelers: [...]
}

// Creates single FlightBooking:
FlightBooking {
  flightBookingId: "FLT-2025-0003",
  pnr: "GHI789",  // Single PNR for all flights
  flightType: "MULTI_CITY",
  itineraries: [
    { /* NYC → LON */ },
    { /* LON → PAR */ },
    { /* PAR → NYC */ }
  ]
}
```

---

## 📊 Data Retrieval (Chronological Order)

### **Get Booking with Services Sorted by Date**

```javascript
GET /api/v1/booking/BK-2025-0001?populate=true

// Response (sorted by serviceDate):
{
  bookingId: "BK-2025-0001",
  services: [
    {
      serviceType: "FLIGHT",
      serviceDate: "2025-11-01T08:00:00Z",  // Flight departure
      flightBooking: {
        pnr: "ABC123",
        itineraries: [...],
        passengers: [...]
      }
    },
    {
      serviceType: "HOTEL",
      serviceDate: "2025-11-01T14:00:00Z",  // Hotel check-in
      hotelData: {
        hotel: "Marriott",
        rooms: [...]
      }
    },
    {
      serviceType: "FLIGHT",
      serviceDate: "2025-11-05T10:00:00Z",  // Return flight
      flightBooking: {
        pnr: "DEF456",
        itineraries: [...]
      }
    }
  ]
}
```

---

## 🛠️ Implementation Steps

### **Phase 1: Create FlightBooking Model** ✅ (Current)

```
1. Create flightBooking.model.ts
2. Define complete schema with all fields
3. Add indexes for performance
4. Add pre-save middleware for validation
5. Export FlightBooking model
```

### **Phase 2: Create FlightBooking Service**

```
1. Create flightBooking.service.ts
2. Implement:
   - createFlightBooking() - Call Amadeus API + save to DB
   - getFlightBooking() - Retrieve by ID
   - updateFlightStatus() - Update status
   - cancelFlightBooking() - Cancel booking
   - generateFlightBookingId() - Sequential ID generation
```

### **Phase 3: Create FlightBooking Controller & Routes**

```
1. Create flightBooking.controller.ts
2. Create flightBooking.route.ts
3. Add endpoints:
   - POST /flight-booking/create
   - GET /flight-booking/:id
   - PATCH /flight-booking/:id
   - DELETE /flight-booking/:id/cancel
```

### **Phase 4: Modify Main Booking Model**

```
1. Add bookingVersion field ("v1" or "v2")
2. Add services array (optional, for v2 bookings)
3. Keep rooms array (for v1 bookings)
4. Add service management methods
```

### **Phase 5: Integration**

```
1. Add endpoint: POST /booking/:id/add-flight
2. Implement service to:
   - Create FlightBooking
   - Upgrade main booking to v2
   - Link flight to booking
   - Update total price
```

### **Phase 6: Testing**

```
1. Test standalone flight bookings
2. Test adding flight to hotel booking
3. Test multi-city flights
4. Test chronological retrieval
5. Test with existing hotel bookings
```

---

## 📝 API Endpoints Summary

### **Flight-Only Operations**

```
POST   /api/v1/flight-booking/create         Create standalone flight
GET    /api/v1/flight-booking/:id            Get flight details
PATCH  /api/v1/flight-booking/:id            Update flight
DELETE /api/v1/flight-booking/:id/cancel     Cancel flight
GET    /api/v1/flight-booking/all            List all flights
```

### **Combined Operations**

```
POST   /api/v1/booking/:id/add-flight        Add flight to existing booking
GET    /api/v1/booking/:id?populate=true     Get booking with all services
```

---

## ✅ Benefits

| Benefit                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| **Backward Compatible** | Existing hotel bookings remain unchanged         |
| **Flexible**            | Supports standalone flights or combined bookings |
| **Scalable**            | Easy to add more service types (cars, tours)     |
| **Organized**           | Services retrieved in chronological order        |
| **Complete Data**       | Full Amadeus response stored for reference       |
| **Multi-City Support**  | Multiple flights in one booking                  |
| **Zero Downtime**       | Can deploy without breaking existing system      |

---

## 🔒 Data Safety

1. ✅ **No modification to existing Booking documents**
2. ✅ **New FlightBooking collection (separate)**
3. ✅ **Version flag for future upgrades**
4. ✅ **Optional linking (not required)**
5. ✅ **Can rollback easily if needed**

---

## 📈 Future Enhancements

- [ ] Add car rental service type
- [ ] Add tour/activity service type
- [ ] Add insurance service type
- [ ] Migrate v1 bookings to v2 (optional)
- [ ] Unified booking invoice generation
- [ ] Multi-currency support
- [ ] Loyalty program integration

---

## 🎯 Current Status

- ✅ **Plan Created**
- ⏳ **Creating FlightBooking Model** (Next Step)
- ⏳ Creating FlightBooking Service
- ⏳ Creating Controllers & Routes
- ⏳ Modifying Main Booking Model
- ⏳ Integration & Testing

---

## 📞 Questions?

If you have any questions or need clarification, please ask before we proceed with implementation!
