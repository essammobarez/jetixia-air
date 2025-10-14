# 🎯 Complete API Endpoints Summary

## 📍 All Available Endpoints

### 1. Search Flight Offers

**POST** `/api/v1/price-list`

Search for available flights with prices.

**Request:**

```json
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "adults": 1,
  "travelClass": "ECONOMY"
}
```

**Response:** List of flight offers with:

- ✅ Airline business names (enriched)
- ✅ Airport names, cities, countries (enriched)
- ✅ Prices in USD
- ✅ Itinerary details

---

### 2. Confirm Flight Pricing

**POST** `/api/v1/price-list/confirm`

Get confirmed actual pricing with detailed information.

**Request:**

```json
{
  "flightOffers": [
    {
      /* Selected flight offer from search API */
    }
  ]
}
```

**Response:** Confirmed pricing with:

- ✅ Actual confirmed price
- ✅ Detailed fare rules and penalties
- ✅ Baggage allowances and fees
- ✅ Credit card fees
- ✅ Booking requirements
- ✅ Tax breakdown

---

### 3. Test Pricing Data

**GET** `/api/v1/price-list/test`

Get static mock data for testing and development.

**Request:** None (just GET)

```bash
curl http://localhost:5000/api/v1/price-list/test
```

**Response:** Complete mock data with exact structure:

- ✅ Sample flight offer (SYD → BKK via XMN)
- ✅ Detailed fare rules
- ✅ Baggage options (1 bag, 2 bags)
- ✅ Credit card fees (all major cards)
- ✅ Booking requirements
- ✅ Location dictionaries

**Use For:**

- Frontend development
- UI/UX testing
- Demo presentations
- Integration testing

---

### 4. Get Seat Maps ⭐ NEW

**POST** `/api/v1/seatmap`

Get detailed seat maps with availability, positions, features, and pricing.

**Request:**

```json
{
  "flightOffers": [
    {
      /* Complete flight offer from /price-list/confirm */
    }
  ]
}
```

**Response:** Seat maps for all segments with:

- ✅ Seat availability (AVAILABLE/OCCUPIED/BLOCKED)
- ✅ Seat positions (Window/Aisle/Middle)
- ✅ Seat features (Exit row, Extra legroom)
- ✅ Seat pricing (Free vs. Premium)
- ✅ Aircraft layout and configuration
- ✅ Per-traveler pricing

**Use For:**

- Displaying seat selection interface
- Showing seat availability
- Premium seat upselling
- Enhanced booking experience

---

### 5. Create Flight Booking

**POST** `/api/v1/booking/create`

Create a flight booking with optional seat selection.

**Request:**

```json
{
  "flightOffer": {
    /* from /price-list/confirm */
  },
  "travelers": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "MALE"
    }
  ],
  "contactEmail": "customer@example.com",
  "contactPhone": "1234567890",
  "contactPhoneCountryCode": "1",
  "address": {
    "lines": ["123 Main St"],
    "postalCode": "10001",
    "cityName": "New York",
    "countryCode": "US"
  },
  "seatSelections": [
    {
      "segmentId": "25",
      "travelerIds": ["1"],
      "number": "12A"
    }
  ],
  "instantTicketing": true
}
```

**Response:** Booking confirmation with:

- ✅ Booking ID and PNR (6-character)
- ✅ E-ticket number (if instant ticketing)
- ✅ Booking status (TICKETED/RESERVED)
- ✅ Ticketing deadline
- ✅ Flight and traveler details

**Options:**

- **Instant Ticketing** (`instantTicketing: true`) - Immediate ticket issuance
- **Delayed Ticketing** (`instantTicketing: false`) - 6-day ticketing window
- **Seat Selection** (optional) - Pre-select seats from seatmap API

---

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────┐
│ Step 1: Search Flights                      │
│ POST /api/v1/price-list                     │
│                                              │
│ Input: Origin, Destination, Date, Passengers│
│ Output: List of flight offers               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 2: Display Results                     │
│                                              │
│ Show: Airline names, Airport names,         │
│       Prices, Durations, Stops              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 3: User Selects Flight                 │
│                                              │
│ Action: User clicks "Select Flight"         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 4: Confirm Pricing                     │
│ POST /api/v1/price-list/confirm             │
│                                              │
│ Input: Selected flight offer                │
│ Output: Confirmed price + details           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 5: Display Details                     │
│                                              │
│ Show: Fare rules, Penalties, Baggage,       │
│       Booking requirements                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 6: Get Seat Maps (Optional) ⭐ NEW     │
│ POST /api/v1/seatmap                        │
│                                              │
│ Input: Confirmed flight offer               │
│ Output: Seat availability & pricing         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 7: User Selects Seats (Optional)       │
│                                              │
│ Show: Seat map with availability            │
│ Action: User selects seats                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Step 8: Create Booking                      │
│ POST /api/v1/booking/create                 │
│                                              │
│ Input: Flight + Travelers + Seats           │
│ Output: Booking confirmation (PNR)          │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing & Development Flow

### Option A: Live API Testing

```bash
# 1. Search flights
POST /api/v1/price-list
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "adults": 1
}

# 2. Confirm selected flight
POST /api/v1/price-list/confirm
{
  "flightOffers": [{ /* from step 1 */ }]
}
```

### Option B: Mock Data Testing ⭐

```bash
# Get test data instantly (no Amadeus credentials needed)
GET /api/v1/price-list/test
```

Use mock data for:

- Building UI components
- Testing frontend logic
- Demo to stakeholders
- Development without API limits

---

## 📊 Quick Reference

| Endpoint              | Method | Purpose            | Requires Auth | Response Time |
| --------------------- | ------ | ------------------ | ------------- | ------------- |
| `/price-list`         | POST   | Search flights     | Yes (Amadeus) | ~2-4 seconds  |
| `/price-list/confirm` | POST   | Confirm pricing    | Yes (Amadeus) | ~1-3 seconds  |
| `/price-list/test`    | GET    | Get mock data      | No            | Instant       |
| `/seatmap`            | POST   | Get seat maps      | Yes (Amadeus) | ~1-2 seconds  |
| `/booking/create`     | POST   | Create booking/PNR | Yes (Amadeus) | ~2-5 seconds  |

---

## 🎯 Data Enrichment

### What Gets Automatically Enriched:

| Original            | Enriched To                             | Source               |
| ------------------- | --------------------------------------- | -------------------- |
| `carrierCode: "MF"` | `carrierName: "XIAMEN AIRLINES"`        | Amadeus Airlines API |
| `iataCode: "SYD"`   | `airportName: "SYDNEY KINGSFORD SMITH"` | Amadeus Location API |
| `iataCode: "SYD"`   | `cityName: "SYDNEY"`                    | Amadeus Location API |
| `iataCode: "SYD"`   | `countryName: "AUSTRALIA"`              | Amadeus Location API |

### What Stays As-Is:

| Field                  | Why                                          |
| ---------------------- | -------------------------------------------- |
| `aircraft.code: "789"` | Keep as code (convert in frontend if needed) |
| `currency: "USD"`      | Fixed to USD                                 |

---

## 💡 Example: Complete Response Structure

### Search API Response (`/price-list`)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "itineraries": [
          {
            "segments": [
              {
                "departure": {
                  "iataCode": "SYD",
                  "airportName": "SYDNEY KINGSFORD SMITH", // ⭐ Enriched
                  "cityName": "SYDNEY", // ⭐ Enriched
                  "countryName": "AUSTRALIA" // ⭐ Enriched
                },
                "arrival": {
                  "iataCode": "BKK",
                  "airportName": "SUVARNABHUMI", // ⭐ Enriched
                  "cityName": "BANGKOK", // ⭐ Enriched
                  "countryName": "THAILAND" // ⭐ Enriched
                },
                "carrierCode": "MF",
                "carrierName": "XIAMEN AIRLINES" // ⭐ Enriched
              }
            ]
          }
        ],
        "price": {
          "total": "248.50",
          "currency": "USD"
        }
      }
    ]
  }
}
```

### Confirm API Response (`/price-list/confirm`)

```json
{
  "success": true,
  "data": {
    "data": {
      "type": "flight-offers-pricing",
      "flightOffers": [
        {
          /* enriched flight offer */
        }
      ],
      "bookingRequirements": {
        /* email, phone, documents */
      }
    },
    "included": {
      "detailed-fare-rules": {
        /* penalties, changes, refunds */
      },
      "bags": {
        /* baggage options and prices */
      },
      "credit-card-fees": {
        /* fees by card brand */
      }
    }
  }
}
```

### Test API Response (`/price-list/test`)

```json
{
  "success": true,
  "data": {
    /* Same structure as confirm API */
    /* Static mock data for SYD → BKK flight */
  }
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Search flights
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{"originLocationCode":"SYD","destinationLocationCode":"BKK","departureDate":"2025-11-02","adults":1}'

# 2. Get test data (instant, no auth needed)
curl http://localhost:5000/api/v1/price-list/test

# 3. Confirm pricing (requires flight offer from search)
curl -X POST http://localhost:5000/api/v1/price-list/confirm \
  -H "Content-Type: application/json" \
  -d '{"flightOffers":[{...}]}'

# 4. Get seat maps (requires flight offer from confirm)
curl -X POST http://localhost:5000/api/v1/seatmap \
  -H "Content-Type: application/json" \
  -d '{"flightOffers":[{...}]}'

# 5. Create booking with seat selection
curl -X POST http://localhost:5000/api/v1/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffer": {...},
    "travelers": [...],
    "contactEmail": "customer@example.com",
    "contactPhone": "1234567890",
    "contactPhoneCountryCode": "1",
    "address": {...},
    "seatSelections": [{"segmentId":"25","travelerIds":["1"],"number":"12A"}],
    "instantTicketing": true
  }'
```

---

## 📚 Documentation Files

| File                                   | Description                            |
| -------------------------------------- | -------------------------------------- |
| `src/app/modules/price-list/README.md` | Complete flight search API docs        |
| `src/app/modules/seatmap/README.md`    | Seat map API documentation ⭐ NEW      |
| `src/app/modules/booking/README.md`    | Booking API with seat selection        |
| `SEATMAP_API_GUIDE.md`                 | Complete seat map implementation guide |
| `AMADEUS_PRICE_LIST_SETUP.md`          | Setup and configuration guide          |
| `PRICING_CONFIRMATION_API.md`          | Pricing confirmation details           |
| `AIRPORT_ENRICHMENT_FEATURE.md`        | Airport enrichment feature docs        |
| `UI_DESIGN_GUIDE.md`                   | UI/UX design recommendations           |
| `API_ENDPOINTS_SUMMARY.md`             | This file (quick reference)            |

---

## ✅ Ready to Use!

All endpoints are configured and ready. Start your server:

```bash
npm run dev
```

Then test with:

```bash
# Quick test with mock data (no setup needed)
curl http://localhost:5000/api/v1/price-list/test

# Live flight search (requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env)
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{"originLocationCode":"SYD","destinationLocationCode":"BKK","departureDate":"2025-11-02","adults":1}'
```

🎉 **Happy Testing!**
