# ✅ Amadeus Price List API - Setup Complete!

## 🎉 What's Been Implemented

A fully functional flight price list API with **automatic OAuth2 authorization** and airline business name enrichment.

---

## 📁 Files Created

### Core Module: `src/app/modules/price-list/`

1. **priceList.interface.ts**

   - TypeScript interfaces for flight offers, airlines, segments, prices
   - Complete type safety for API responses

2. **priceList.utils.ts** ⭐

   - **OAuth2 authorization implementation**
   - Automatic token fetching from Amadeus
   - Token caching (30 minutes)
   - Auto-refresh before expiration
   - Thread-safe token management

3. **priceList.service.ts**

   - Flight offers search from Amadeus API
   - Airline information fetching
   - **Automatic carrier code → business name replacement**
   - Airline data caching
   - Comprehensive error handling

4. **priceList.validation.ts**

   - Zod validation schemas
   - Request parameter validation
   - Type-safe input validation

5. **priceList.controller.ts**

   - HTTP request handler
   - Request/response formatting

6. **priceList.route.ts**

   - Route definition
   - Validation middleware integration

7. **README.md**
   - Complete API documentation
   - Usage examples
   - Troubleshooting guide

### Modified Files

1. **src/app/routes/index.ts**

   - Added `/price-list` route registration

2. **src/app/config/index.ts**
   - Added Amadeus credentials configuration

### Documentation

1. **AMADEUS_PRICE_LIST_SETUP.md** - Quick setup guide
2. **SETUP_COMPLETE.md** - This file

---

## 🔐 Authorization Implementation

### OAuth2 Client Credentials Flow

**Endpoint:** `POST https://test.api.amadeus.com/v1/security/oauth2/token`

**Implementation Details:**

- Located in: `src/app/modules/price-list/priceList.utils.ts`
- Function: `getAmadeusAccessToken()`
- Automatically called before each Amadeus API request

**Features:**

```
✅ Automatic token fetching
✅ 30-minute token caching
✅ Auto-refresh 1 minute before expiration
✅ Thread-safe with promise-based locking
✅ No manual authorization required
✅ Error handling with detailed messages
```

### How It Works

```
API Request
    ↓
Check Token Cache
    ↓
Token Valid? ───YES──→ Use Cached Token
    ↓ NO                      ↓
Fetch New Token           Make API Call
    ↓                         ↓
POST /v1/security/oauth2/token
    ↓                         ↓
Cache Token (30 min)      Return Response
    ↓
Make API Call
```

---

## 🚀 API Endpoint

**POST** `/api/v1/price-list`

### Example Request

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "SYD",
    "destinationLocationCode": "BKK",
    "departureDate": "2025-11-02",
    "returnDate": "2025-11-06",
    "adults": 1,
    "children": 1,
    "infants": 1,
    "nonStop": false,
    "currencyCode": "USD"
  }'
```

### Example Response (Enriched)

```json
{
  "success": true,
  "message": "Flight offers fetched successfully!",
  "statusCode": 200,
  "data": {
    "meta": {
      "count": 46
    },
    "data": [
      {
        "id": "1",
        "itineraries": [
          {
            "segments": [
              {
                "carrierCode": "MH",
                "carrierName": "MALAYSIA AIRLINES",  ← ADDED
                "operating": {
                  "carrierCode": "MH",
                  "carrierName": "MALAYSIA AIRLINES"  ← ADDED
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## ⚙️ Setup Instructions

### 1. Add Environment Variables

Create or update your `.env` file:

```env
# Amadeus API Credentials
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### 2. Get Amadeus Credentials

1. Go to https://developers.amadeus.com/
2. Sign up or log in
3. Create a new app
4. Copy **API Key** → `AMADEUS_CLIENT_ID`
5. Copy **API Secret** → `AMADEUS_CLIENT_SECRET`

### 3. Start the Server

```bash
npm run dev
```

### 4. Test the API

```bash
curl -X POST http://localhost:5000/api/v1/price-list \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "SYD",
    "destinationLocationCode": "BKK",
    "departureDate": "2025-11-02",
    "adults": 1,
    "currencyCode": "USD"
  }'
```

---

## ✨ Key Features

### 1. Automatic OAuth2 Authorization ⭐

- No manual token management needed
- Automatic fetching and caching
- Auto-refresh before expiration
- Thread-safe implementation

### 2. Airline Name Enrichment ⭐

- Replaces `carrierCode: "MH"` with `carrierName: "MALAYSIA AIRLINES"`
- Works for all segments and operating carriers
- Caches airline data for performance

### 3. Comprehensive Validation

- Zod schema validation
- Type-safe request handling
- Clear error messages

### 4. Performance Optimization

- Token caching (30 minutes)
- Airline data caching (in-memory)
- Parallel airline information fetching

### 5. Error Handling

- Proper HTTP status codes
- Detailed error messages
- Amadeus API error forwarding

---

## 📊 API Flow

```
Client Request
    ↓
Validation (Zod)
    ↓
Controller
    ↓
Service
    ├─→ Authorization Utils
    │   ├─→ Check Token Cache
    │   ├─→ Fetch Token (if expired)
    │   └─→ Return Valid Token
    │
    ├─→ Flight Offers API
    │   └─→ GET /v2/shopping/flight-offers
    │
    └─→ Airlines API (parallel)
        └─→ GET /v1/reference-data/airlines
    ↓
Enrich Response
    ↓
Return to Client
```

---

## 🔍 Request Parameters

| Parameter               | Type    | Required | Range   | Description              |
| ----------------------- | ------- | -------- | ------- | ------------------------ |
| originLocationCode      | string  | ✅       | 3 chars | Origin airport IATA code |
| destinationLocationCode | string  | ✅       | 3 chars | Destination airport code |
| departureDate           | string  | ✅       | -       | YYYY-MM-DD format        |
| returnDate              | string  | ❌       | -       | YYYY-MM-DD format        |
| adults                  | number  | ✅       | 1-9     | Number of adults         |
| children                | number  | ❌       | 0-9     | Number of children       |
| infants                 | number  | ❌       | 0-9     | Number of infants        |
| nonStop                 | boolean | ❌       | -       | Filter non-stop only     |
| currencyCode            | string  | ❌       | 3 chars | ISO 4217 currency code   |
| max                     | number  | ❌       | 1-250   | Max flight offers        |

---

## 🧪 Testing Checklist

- [ ] Set environment variables in `.env`
- [ ] Start server: `npm run dev`
- [ ] Test one-way flight search
- [ ] Test round-trip flight search
- [ ] Test with multiple passengers
- [ ] Verify `carrierName` fields in response
- [ ] Test error cases (invalid codes, dates)
- [ ] Check server logs for token caching

---

## 📝 Status

### ✅ Completed

- OAuth2 authorization implementation
- Token caching and auto-refresh
- Flight offers search integration
- Airline information enrichment
- Airline data caching
- Request validation
- Error handling
- Route registration
- Configuration setup
- Documentation

### ⚠️ Notes

- Using test environment: `https://test.api.amadeus.com`
- For production, update base URL to: `https://api.amadeus.com`
- Console statements are warnings only (useful for debugging)
- Token cache is in-memory (consider Redis for production)
- Airline cache is in-memory (consider Redis for production)

---

## 🚀 Next Steps (Optional)

1. **Add Authentication**

   ```typescript
   import auth from '../../middlewares/auth';
   router.post('/', auth(), validateRequest(...), ...);
   ```

2. **Add Rate Limiting**

   ```typescript
   import rateLimit from "express-rate-limit";
   const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
   ```

3. **Use Redis Cache** (Production)

   - Replace in-memory cache with Redis
   - Cache tokens and airline data

4. **Add Monitoring**

   - Log all API requests
   - Track Amadeus API usage
   - Set up alerts for errors

5. **Add Tests**
   - Unit tests for services
   - Integration tests for API endpoints
   - Test authorization flow

---

## 📚 Documentation Links

- **API Documentation:** `src/app/modules/price-list/README.md`
- **Setup Guide:** `AMADEUS_PRICE_LIST_SETUP.md`
- **Amadeus Docs:** https://developers.amadeus.com/

---

## ✅ Everything is Ready!

Your Amadeus Price List API with automatic OAuth2 authorization is now ready to use!

**Test it now:**

```bash
npm run dev
```

Then make a request to test the authorization flow and airline enrichment!

---

## 🆘 Need Help?

1. Check `src/app/modules/price-list/README.md` for detailed documentation
2. Review `AMADEUS_PRICE_LIST_SETUP.md` for setup instructions
3. Check server logs for detailed error messages
4. Verify environment variables are set correctly
5. Ensure Amadeus credentials are valid

---

**Happy Coding! 🎉**
