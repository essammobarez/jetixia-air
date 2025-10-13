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

### 3. Test Pricing Data ⭐ NEW

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
│ Step 6: Proceed to Booking                  │
│                                              │
│ Action: User confirms and books             │
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

| Endpoint              | Method | Purpose         | Requires Auth | Response Time |
| --------------------- | ------ | --------------- | ------------- | ------------- |
| `/price-list`         | POST   | Search flights  | Yes (Amadeus) | ~2-4 seconds  |
| `/price-list/confirm` | POST   | Confirm pricing | Yes (Amadeus) | ~1-3 seconds  |
| `/price-list/test`    | GET    | Get mock data   | No            | Instant       |

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
# Search flights
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{"originLocationCode":"SYD","destinationLocationCode":"BKK","departureDate":"2025-11-02","adults":1}'

# Get test data (instant, no auth needed)
curl http://localhost:5000/api/v1/price-list/test

# Confirm pricing (requires flight offer from search)
curl -X POST http://localhost:5000/api/v1/price-list/confirm \
  -H "Content-Type: application/json" \
  -d '{"flightOffers":[{...}]}'
```

---

## 📚 Documentation Files

| File                                   | Description                     |
| -------------------------------------- | ------------------------------- |
| `src/app/modules/price-list/README.md` | Complete API documentation      |
| `AMADEUS_PRICE_LIST_SETUP.md`          | Setup and configuration guide   |
| `PRICING_CONFIRMATION_API.md`          | Pricing confirmation details    |
| `AIRPORT_ENRICHMENT_FEATURE.md`        | Airport enrichment feature docs |
| `UI_DESIGN_GUIDE.md`                   | UI/UX design recommendations    |
| `API_ENDPOINTS_SUMMARY.md`             | This file (quick reference)     |

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
