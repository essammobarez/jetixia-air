# Amadeus Price List API - Setup Guide

## What Was Created

A new API endpoint to fetch flight offers from Amadeus API with **automatic OAuth2 authorization** and airline name enrichment.

## 🔐 Authorization Flow

The API implements **Amadeus OAuth2 Client Credentials Flow**:

**Step 0: Authorization**  
`POST https://test.api.amadeus.com/v1/security/oauth2/token`

**Body Parameters:**

- `grant_type`: "client_credentials"
- `client_id`: Your Amadeus API Key
- `client_secret`: Your Amadeus API Secret

**Features:**

- ✅ Automatic token fetching and caching
- ✅ Auto-refresh before expiration (30-minute tokens)
- ✅ Thread-safe token management
- ✅ No manual authorization needed

## Files Created

```
src/app/modules/price-list/
├── priceList.interface.ts       # TypeScript interfaces and types
├── priceList.utils.ts            # OAuth2 authorization & token management
├── priceList.service.ts          # Service layer with Amadeus integration
├── priceList.validation.ts       # Zod validation schemas
├── priceList.controller.ts       # Request handler
├── priceList.route.ts            # Route definitions
└── README.md                     # API documentation
```

## Files Modified

1. **src/app/routes/index.ts** - Added route registration
2. **src/app/config/index.ts** - Added Amadeus credentials configuration

## Environment Variables Required

Add these to your `.env` file:

```env
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### How to Get Amadeus Credentials

1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Create an account or sign in
3. Create a new app in your dashboard
4. Copy the API Key (Client ID) and API Secret (Client Secret)
5. For testing, use the test environment credentials
6. For production, request production access

## API Endpoint

**POST** `/api/v1/price-list`

## Quick Test

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

## Features

✅ **Automatic OAuth2 authorization** - handles Amadeus authentication automatically  
✅ **Token management** - caches and auto-refreshes access tokens  
✅ Fetches flight offers from Amadeus API  
✅ Supports one-way and round-trip flights  
✅ Multiple passenger types (adults, children, infants)  
✅ **Automatic airline name enrichment** - replaces carrier codes with business names  
✅ Caches airline information for better performance  
✅ Full validation with Zod  
✅ Error handling with custom error messages

## How It Works

1. **Request received** → Validates request parameters with Zod
2. **Authorization** → Automatically fetches/uses cached OAuth2 token
   - Checks token cache
   - If expired: Fetches new token from Amadeus OAuth API
   - Caches token for 30 minutes
3. **Fetch flight offers** → Calls Amadeus Flight Offers API with token
4. **Collect carrier codes** → Extracts all unique airline codes from segments
5. **Fetch airline info** → Calls Amadeus Airlines API for each carrier
6. **Enrich data** → Replaces carrier codes with business names
7. **Cache airlines** → Stores airline info in memory to avoid repeated calls
8. **Return response** → Sends enriched flight data

### Authorization Flow Diagram

```
Request → Check Token Cache
            ↓
        Token Valid?
      ↓NO         ↓YES
  Fetch Token    Use Token
      ↓             ↓
  Cache 30min    Make API Call
      ↓             ↓
  Make API Call  Return Data
```

## Example Response

Before enrichment:

```json
{
  "carrierCode": "MH",
  "operating": {
    "carrierCode": "MH"
  }
}
```

After enrichment:

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

## Sample Request Body

### One-Way Flight

```json
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "adults": 1,
  "nonStop": false,
  "currencyCode": "USD"
}
```

### Round-Trip Flight with Multiple Passengers

```json
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "returnDate": "2025-11-06",
  "adults": 1,
  "children": 1,
  "infants": 1,
  "nonStop": false,
  "currencyCode": "USD",
  "max": 250
}
```

## Testing

1. Start your server:

   ```bash
   npm run dev
   ```

2. Use Postman or curl to test the endpoint

3. Check the response - all `carrierCode` fields should now have corresponding `carrierName` fields with airline business names

## Troubleshooting

### "Amadeus credentials not configured"

- Ensure `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` are set in `.env`

### "Authentication failed with Amadeus API"

- Verify your credentials are correct
- Check if credentials are for test or production environment

### "Invalid request parameters"

- Ensure date format is YYYY-MM-DD
- Verify airport codes are valid 3-letter IATA codes
- Check passenger counts are within limits (1-9)

### "Failed to fetch flight offers from Amadeus"

- Check your internet connection
- Verify Amadeus API is accessible
- Review server logs for detailed error messages

## Production Considerations

1. **Change API Base URL** - Update `AMADEUS_BASE_URL` in `priceList.service.ts` from test to production URL
2. **Use Production Credentials** - Request production access from Amadeus
3. **Implement Rate Limiting** - Add rate limiting middleware
4. **Add Request Logging** - Log all API requests for monitoring
5. **Cache Airline Data** - Consider using Redis for airline information cache
6. **Add Authentication** - Protect the endpoint with JWT auth middleware
7. **Monitor API Usage** - Track Amadeus API usage and costs

## Next Steps

- Add authentication middleware if needed
- Implement request rate limiting
- Add more detailed logging
- Consider adding database caching for airline information
- Add unit and integration tests
