# Flight Price List API (Amadeus Integration)

This API integrates with Amadeus Flight Offers API to fetch flight price lists with enriched airline information and automatic OAuth2 authorization.

## 📍 API Endpoints

1. **POST** `/api/v1/price-list` - Search flight offers with prices
2. **POST** `/api/v1/price-list/confirm` - Get confirmed pricing with detailed information
3. **GET** `/api/v1/price-list/test` - Get test pricing data (mock data for development)

---

## 🔐 Authorization Flow

The API implements **Amadeus OAuth2 Client Credentials Flow** with automatic token management:

### Step 0: Authorization

**Endpoint:** `POST https://test.api.amadeus.com/v1/security/oauth2/token`

**Body Parameters:**

- `grant_type`: "client_credentials"
- `client_id`: Your Amadeus API Key
- `client_secret`: Your Amadeus API Secret

**Features:**

- ✅ Automatic token fetching
- ✅ Token caching (30 minutes)
- ✅ Auto-refresh before expiration
- ✅ Thread-safe token refresh

## 🚀 Features

- ✅ Fetches flight offers from Amadeus API
- ✅ **Automatic OAuth2 authorization with token management**
- ✅ Support for one-way and round-trip flights
- ✅ Multiple passenger types (adults, children, infants)
- ✅ **Automatic replacement of airline carrier codes with business names**
- ✅ **Automatic airport code enrichment with airport names, cities, and countries**
- ✅ Airline and airport information caching for performance optimization
- ✅ Full request validation with Zod
- ✅ Comprehensive error handling

## 📍 API Endpoint

**POST** `/api/v1/price-list`

## 📝 Request Body

```json
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "returnDate": "2025-11-06",
  "adults": 1,
  "children": 1,
  "infants": 1,
  "travelClass": "ECONOMY",
  "nonStop": false,
  "max": 250
}
```

**Note:** All prices are returned in **USD** (fixed currency).

## 📋 Request Parameters

| Parameter               | Type    | Required | Description                                  | Example      |
| ----------------------- | ------- | -------- | -------------------------------------------- | ------------ |
| originLocationCode      | string  | Yes      | Origin airport IATA code (3 characters)      | "SYD"        |
| destinationLocationCode | string  | Yes      | Destination airport IATA code (3 characters) | "BKK"        |
| departureDate           | string  | Yes      | Departure date in YYYY-MM-DD format          | "2025-11-02" |
| returnDate              | string  | No       | Return date in YYYY-MM-DD format             | "2025-11-06" |
| adults                  | number  | Yes      | Number of adult passengers (1-9)             | 1            |
| children                | number  | No       | Number of child passengers (0-9)             | 1            |
| infants                 | number  | No       | Number of infant passengers (0-9)            | 1            |
| travelClass             | string  | No       | Cabin class filter                           | "ECONOMY"    |
| nonStop                 | boolean | No       | Filter for non-stop flights only             | false        |
| max                     | number  | No       | Maximum number of flight offers (1-250)      | 250          |

> **Currency:** All prices are returned in **USD** (United States Dollar). This is fixed and cannot be changed.

**Travel Class Options:**

- `ECONOMY` - Economy class
- `PREMIUM_ECONOMY` - Premium economy class
- `BUSINESS` - Business class
- `FIRST` - First class

## 📤 Response Structure

```json
{
  "success": true,
  "message": "Flight offers fetched successfully!",
  "statusCode": 200,
  "data": {
    "meta": {
      "count": 46,
      "links": {
        "self": "https://test.api.amadeus.com/v2/shopping/flight-offers..."
      }
    },
    "data": [
      {
        "type": "flight-offer",
        "id": "1",
        "source": "GDS",
        "instantTicketingRequired": false,
        "nonHomogeneous": false,
        "oneWay": false,
        "isUpsellOffer": false,
        "lastTicketingDate": "2025-10-22",
        "lastTicketingDateTime": "2025-10-22",
        "numberOfBookableSeats": 9,
        "itineraries": [
          {
            "duration": "PT7H30M",
            "segments": [
              {
                "departure": {
                  "iataCode": "SYD",
                  "terminal": "1",
                  "at": "2025-11-02T12:30:00",
                  "airportName": "SYDNEY KINGSFORD SMITH",
                  "cityName": "SYDNEY",
                  "countryName": "AUSTRALIA"
                },
                "arrival": {
                  "iataCode": "XMN",
                  "terminal": "3",
                  "at": "2025-11-02T18:55:00",
                  "airportName": "GAOQI INTL",
                  "cityName": "XIAMEN",
                  "countryName": "CHINA"
                },
                "carrierCode": "MF",
                "carrierName": "XIAMEN AIRLINES",
                "number": "197",
                "aircraft": {
                  "code": "333"
                },
                "operating": {
                  "carrierCode": "MH",
                  "carrierName": "MALAYSIA AIRLINES"
                },
                "duration": "PT4H",
                "id": "63",
                "numberOfStops": 0,
                "blacklistedInEU": false
              }
            ]
          }
        ],
        "price": {
          "currency": "USD",
          "total": "450.00",
          "base": "400.00",
          "grandTotal": "450.00"
        }
      }
    ]
  }
}
```

## 🔑 Key Features Explained

### 1. OAuth2 Authorization

The API automatically handles Amadeus OAuth2 authentication:

```
Request → Check Token Cache → Token Expired?
  ↓ Yes                          ↓ No
Fetch New Token              Use Cached Token
  ↓
Cache for 30 mins
  ↓
Make API Request
```

**Implementation:**

- Located in: `priceList.utils.ts`
- Function: `getAmadeusAccessToken()`
- Automatic token refresh 1 minute before expiration
- Thread-safe with promise-based locking

### 2. Airline Name Enrichment

The API automatically fetches airline business names and replaces carrier codes:

**Before Enrichment:**

```json
{
  "carrierCode": "MH",
  "operating": {
    "carrierCode": "MH"
  }
}
```

**After Enrichment:**

```json
{
  "carrierCode": "MH",
  "carrierName": "MALAYSIA AIRLINES",
  "operating": {
    "carrierCode": "MH",
    "carrierName": "MALAYSIA AIRLINES"
  }
}
```

**Process:**

1. Extract all unique carrier codes from flight segments
2. Fetch airline information from Amadeus Airlines API
3. Cache airline data in memory
4. Replace carrier codes with business names in response

### 2b. Airport Information Enrichment ⭐ NEW

The API automatically fetches airport details and adds them to departure/arrival information:

**Before Enrichment:**

```json
{
  "departure": {
    "iataCode": "SYD",
    "terminal": "1",
    "at": "2025-11-02T12:30:00"
  },
  "arrival": {
    "iataCode": "BKK",
    "at": "2025-11-03T00:45:00"
  }
}
```

**After Enrichment:**

```json
{
  "departure": {
    "iataCode": "SYD",
    "terminal": "1",
    "at": "2025-11-02T12:30:00",
    "airportName": "SYDNEY KINGSFORD SMITH",
    "cityName": "SYDNEY",
    "countryName": "AUSTRALIA"
  },
  "arrival": {
    "iataCode": "BKK",
    "at": "2025-11-03T00:45:00",
    "airportName": "SUVARNABHUMI",
    "cityName": "BANGKOK",
    "countryName": "THAILAND"
  }
}
```

**Process:**

1. Extract all unique airport codes from segments (departure & arrival)
2. Fetch airport information from Amadeus Location API
3. Cache airport data in memory
4. Add airport names, city names, and country names to response

### 3. Performance Optimization

**Airline Information Caching:**

- First request: Fetches from Amadeus Airlines API
- Subsequent requests: Uses cached data
- Cache is in-memory and persists until server restart

**Airport Information Caching:**

- First request: Fetches from Amadeus Location API
- Subsequent requests: Uses cached data
- Cache is in-memory and persists until server restart
- Significantly reduces API calls for common airports

**Token Caching:**

- OAuth token cached for 30 minutes
- Automatic refresh when expired
- Prevents unnecessary authentication requests

## ⚙️ Environment Variables

Add these to your `.env` file:

```env
# Amadeus API Credentials
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### How to Get Amadeus Credentials

1. Visit [Amadeus for Developers](https://developers.amadeus.com/)
2. Create an account or sign in
3. Create a new app in your dashboard
4. Copy the **API Key** (use as `AMADEUS_CLIENT_ID`)
5. Copy the **API Secret** (use as `AMADEUS_CLIENT_SECRET`)
6. For testing, use test environment credentials
7. For production, request production access

## 📚 Example Usage

### One-Way Flight

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "SYD",
    "destinationLocationCode": "BKK",
    "departureDate": "2025-11-02",
    "adults": 1,
    "nonStop": false
  }'
```

### Round-Trip Flight with Multiple Passengers

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "SYD",
    "destinationLocationCode": "BKK",
    "departureDate": "2025-11-02",
    "returnDate": "2025-11-06",
    "adults": 2,
    "children": 1,
    "infants": 0,
    "nonStop": false,
    "max": 100
  }'
```

### Business Class Flights

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "DAC",
    "destinationLocationCode": "SIN",
    "departureDate": "2025-11-02",
    "adults": 1,
    "travelClass": "BUSINESS"
  }'
```

### Non-Stop Flights Only

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "DAC",
    "destinationLocationCode": "SIN",
    "departureDate": "2025-11-02",
    "adults": 1,
    "nonStop": true
  }'
```

---

### 2. Confirm Flight Pricing

**POST** `/api/v1/price-list/confirm`

Get confirmed pricing with detailed information including:

- ✅ Detailed fare rules
- ✅ Baggage allowances and fees
- ✅ Credit card fees
- ✅ Other services
- ✅ Booking requirements

#### Request Body

```json
{
  "flightOffers": [
    {
      "type": "flight-offer",
      "id": "1",
      "source": "GDS",
      "instantTicketingRequired": false,
      "nonHomogeneous": false,
      "oneWay": false,
      "isUpsellOffer": false,
      "lastTicketingDate": "2025-10-28",
      "lastTicketingDateTime": "2025-10-28",
      "numberOfBookableSeats": 9,
      "itineraries": [
        {
          "duration": "PT16H15M",
          "segments": [
            {
              "departure": {
                "iataCode": "SYD",
                "terminal": "1",
                "at": "2025-11-02T12:30:00"
              },
              "arrival": {
                "iataCode": "XMN",
                "terminal": "3",
                "at": "2025-11-02T18:55:00"
              },
              "carrierCode": "MF",
              "number": "802",
              "aircraft": {
                "code": "789"
              },
              "operating": {
                "carrierCode": "MF"
              },
              "duration": "PT9H25M",
              "id": "25",
              "numberOfStops": 0,
              "blacklistedInEU": false
            }
          ]
        }
      ],
      "price": {
        "currency": "USD",
        "total": "248.50",
        "base": "78.00"
      },
      "pricingOptions": {
        "fareType": ["PUBLISHED"],
        "includedCheckedBagsOnly": true
      },
      "validatingAirlineCodes": ["MF"],
      "travelerPricings": [
        {
          "travelerId": "1",
          "fareOption": "STANDARD",
          "travelerType": "ADULT",
          "price": {
            "currency": "USD",
            "total": "248.50",
            "base": "78.00"
          }
        }
      ]
    }
  ]
}
```

**Note:** The `flightOffers` array comes from the **Search Flight Offers** API response (`/api/v1/price-list`). Simply pass the flight offer(s) you want to confirm.

#### Request Parameters

| Parameter    | Type  | Required | Description                            | Max |
| ------------ | ----- | -------- | -------------------------------------- | --- |
| flightOffers | array | Yes      | Array of flight offers from search API | 1-6 |

#### Response Structure

The response includes:

**Main Data:**

- Confirmed flight offers with actual prices
- Booking requirements (email, phone, documents)

**Included Details:**

- `detailed-fare-rules` - Complete fare rules and penalties
- `bags` - Baggage allowances and additional baggage prices
- `credit-card-fees` - Fees for different payment methods
- `other-services` - Additional services available

**Dictionaries:**

- Location details (cities, countries)
- Carrier information

#### Example Usage

```bash
curl -X POST http://localhost:5000/api/v1/price-list/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffers": [
      {
        "type": "flight-offer",
        "id": "1",
        ...
      }
    ]
  }'
```

#### Use Case Flow

1. **Step 1:** Call `/api/v1/price-list` to search flights
2. **Step 2:** User selects a flight from the list
3. **Step 3:** Call `/api/v1/price-list/confirm` with selected flight offer
4. **Step 4:** Display confirmed price, fare rules, baggage info, etc.
5. **Step 5:** Proceed to booking

---

### 3. Test Pricing Data (Mock)

**GET** `/api/v1/price-list/test`

Get static test data for frontend development and testing.

#### Purpose

- ✅ Frontend development without API credentials
- ✅ Testing UI components
- ✅ Demo and presentation
- ✅ Integration testing

#### Request

No request body needed - just a GET request!

```bash
curl -X GET http://localhost:5000/api/v1/price-list/test
```

#### Response

Returns complete mock pricing confirmation data including:

- Flight offers with pricing
- Detailed fare rules
- Baggage information
- Credit card fees
- Booking requirements
- Dictionaries

**Note:** This is static test data. Use `/confirm` endpoint for actual live pricing.

---

## ❌ Error Handling

The API returns appropriate error responses with detailed messages:

### 400 Bad Request

Invalid request parameters

```json
{
  "success": false,
  "message": "Origin location code must be 3 characters (IATA code)",
  "statusCode": 400,
  "data": null
}
```

### 401 Unauthorized

Authentication failed with Amadeus API

```json
{
  "success": false,
  "message": "Authentication failed with Amadeus API. Please check your credentials.",
  "statusCode": 401,
  "data": null
}
```

### 404 Not Found

No flights found for the search criteria

```json
{
  "success": false,
  "message": "No flight offers found for the given search criteria",
  "statusCode": 404,
  "data": null
}
```

### 409 Conflict

Price has changed or flight no longer available (Pricing confirmation only)

```json
{
  "success": false,
  "message": "Flight offer price has changed or is no longer available",
  "statusCode": 409,
  "data": null
}
```

### 500 Internal Server Error

Server error or Amadeus API error

```json
{
  "success": false,
  "message": "Failed to fetch flight offers from Amadeus API",
  "statusCode": 500,
  "data": null
}
```

## 🏗️ Architecture

### File Structure

```
src/app/modules/price-list/
├── priceList.interface.ts    # TypeScript interfaces
├── priceList.utils.ts         # OAuth2 authorization & token management
├── priceList.service.ts       # Business logic & Amadeus API integration
├── priceList.validation.ts    # Zod validation schemas
├── priceList.controller.ts    # Request handlers
├── priceList.route.ts         # Route definitions
└── README.md                  # Documentation
```

### Data Flow

```
Client Request
    ↓
Route (priceList.route.ts)
    ↓
Validation Middleware (priceList.validation.ts)
    ↓
Controller (priceList.controller.ts)
    ↓
Service (priceList.service.ts)
    ├→ Authorization (priceList.utils.ts)
    │   └→ Amadeus OAuth2 Token API
    ├→ Flight Search
    │   └→ Amadeus Flight Offers API
    └→ Airline Enrichment
        └→ Amadeus Airlines API
    ↓
Response Formatting
    ↓
Client Response
```

## 🔧 API Endpoints Used

### 1. OAuth2 Token (Authorization)

- **URL:** `POST https://test.api.amadeus.com/v1/security/oauth2/token`
- **Purpose:** Get access token for API authentication
- **Auth:** Client credentials (client_id + client_secret)

### 2. Flight Offers Search

- **URL:** `GET https://test.api.amadeus.com/v2/shopping/flight-offers`
- **Purpose:** Search for flight offers and prices
- **Auth:** Bearer token (OAuth2)
- **Docs:** [Amadeus Flight Offers Search](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)

### 3. Flight Offers Pricing

- **URL:** `POST https://test.api.amadeus.com/v1/shopping/flight-offers/pricing`
- **Purpose:** Confirm pricing and get detailed fare information
- **Auth:** Bearer token (OAuth2)
- **Query:** `include=credit-card-fees,bags,other-services,detailed-fare-rules&forceClass=false`
- **Docs:** [Amadeus Flight Offers Price](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-price)

### 4. Airlines Reference Data

- **URL:** `GET https://test.api.amadeus.com/v1/reference-data/airlines`
- **Purpose:** Get airline business names by IATA code
- **Auth:** Bearer token (OAuth2)

### 5. Airport & City Search (Location API)

- **URL:** `GET https://test.api.amadeus.com/v1/reference-data/locations`
- **Purpose:** Get airport names, cities, and countries by IATA code
- **Auth:** Bearer token (OAuth2)
- **Docs:** [Amadeus Airport & City Search](https://developers.amadeus.com/self-service/category/flights/api-doc/airport-and-city-search)

## 🐛 Troubleshooting

### "Amadeus credentials not configured"

**Solution:** Ensure `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` are set in `.env`

### "Authentication failed with Amadeus API"

**Causes:**

- Incorrect client ID or secret
- Using production credentials with test URL (or vice versa)
- Expired or revoked credentials

**Solution:** Verify credentials and environment in Amadeus dashboard

### "Invalid request parameters"

**Common Issues:**

- Date format not YYYY-MM-DD
- Invalid airport IATA codes
- Passenger counts out of range (1-9)
- Currency code not 3 characters

**Solution:** Check request body format and parameter validation

### "No flight offers found"

**Causes:**

- No flights available for the route/date
- Invalid origin/destination codes
- Search criteria too restrictive

**Solution:** Try different dates or less restrictive criteria

## 🚀 Production Considerations

### 1. Change API Base URL

Update `AMADEUS_BASE_URL` in `priceList.utils.ts`:

```typescript
const AMADEUS_BASE_URL = "https://api.amadeus.com"; // Production URL
```

### 2. Use Production Credentials

Request production access from Amadeus and update `.env`:

```env
AMADEUS_CLIENT_ID=your_production_client_id
AMADEUS_CLIENT_SECRET=your_production_client_secret
```

### 3. Implement Redis Cache

Replace in-memory cache with Redis for airline data:

```typescript
// Instead of Map
const airlineCache = new Map<string, AirlineInfo>();

// Use Redis
import Redis from "ioredis";
const redis = new Redis();
```

### 4. Add Rate Limiting

Protect the endpoint from abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/', limiter, ...);
```

### 5. Add Authentication

Protect the endpoint with JWT authentication:

```typescript
import auth from '../../middlewares/auth';

router.post('/', auth(), validateRequest(...), ...);
```

### 6. Monitoring & Logging

- Log all API requests and responses
- Track Amadeus API usage and costs
- Monitor token refresh failures
- Set up alerts for errors

### 7. Error Reporting

Integrate error tracking (e.g., Sentry):

```typescript
import * as Sentry from "@sentry/node";
Sentry.captureException(error);
```

## 📊 Performance Metrics

- **Authorization:** ~200-500ms (first request)
- **Cached Token:** ~0ms (subsequent requests)
- **Flight Search:** ~1-3 seconds
- **Airline Enrichment:** ~100-500ms (first time)
- **Cached Airlines:** ~0ms (subsequent requests)

## 📖 Related Documentation

- [Amadeus API Documentation](https://developers.amadeus.com/)
- [Flight Offers Search API](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)
- [Airlines Reference Data API](https://developers.amadeus.com/self-service/category/flights/api-doc/airlines-reference-data)
- [Amadeus Authentication](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search/api-reference)

## 🧪 Testing

### Test with Postman

1. Create a POST request to `http://localhost:5000/api/v1/price-list`
2. Set header: `Content-Type: application/json`
3. Use example request body from above
4. Send request and verify response

### Test with curl

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d @test-request.json
```

### Verify Airline Enrichment

Check the response segments:

- ✅ `carrierName` field should be present
- ✅ `carrierName` should contain airline business name
- ✅ `operating.carrierName` should also be enriched

## 🎯 Next Steps

- [ ] Add user authentication middleware
- [ ] Implement request rate limiting
- [ ] Add comprehensive unit tests
- [ ] Set up integration tests
- [ ] Add Redis caching for production
- [ ] Implement request/response logging
- [ ] Set up monitoring and alerts
- [ ] Add API documentation (Swagger/OpenAPI)
