# 🧪 Sabre API Test Guide

## 🔐 Environment Setup

Add these to your `.env` file:

```env
# Sabre API Credentials (Certification/Test Environment)
SABRE_CLIENT_ID=V1:xq3lzxku0rkguczn:DEVCENTER:EXT
SABRE_CLIENT_SECRET=67hwpTLR
SABRE_BASE_URL=https://api-crt.cert.havail.sabre.com
```

## 🚀 Available Test Endpoints

Your Sabre test API is already set up with 4 endpoints:

### 1. Test Authentication Only
**GET** `/api/v1/sabre-test/auth`

Tests OAuth2 token generation with your credentials.

### 2. Test Connection (Auth + Simple API Call)
**GET** `/api/v1/sabre-test/connection`

Tests authentication + makes a simple API call to verify connection.

### 3. Test Flight Search
**GET** `/api/v1/sabre-test/flight-search`

Tests a real flight search (JFK → LAX) to verify flight API works.

### 4. Run All Tests
**GET** `/api/v1/sabre-test/all`

Runs all tests in sequence and provides a comprehensive report.

---

## 🧪 Curl Commands to Test

### Start Your Server
```bash
npm run dev
```

### 1. Test Authentication
```bash
curl -X GET http://localhost:5000/api/v1/sabre-test/auth
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sabre authentication successful! ✅",
  "data": {
    "authenticated": true,
    "tokenReceived": true,
    "tokenLength": 1234,
    "tokenPreview": "eyJ0eXAiOiJKV1QiLCJ..."
  }
}
```

### 2. Test Connection
```bash
curl -X GET http://localhost:5000/api/v1/sabre-test/connection
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sabre connection successful! ✅",
  "data": {
    "authentication": {
      "status": "Connected",
      "tokenObtained": true,
      "baseUrl": "https://api-crt.cert.havail.sabre.com"
    },
    "testApiCall": {
      "endpoint": "/v1/lists/utilities/countries",
      "status": 200,
      "countriesCount": 249,
      "sampleCountries": [...]
    }
  }
}
```

### 3. Test Flight Search
```bash
curl -X GET http://localhost:5000/api/v1/sabre-test/flight-search
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sabre flight search successful! ✅",
  "data": {
    "searchRequest": {
      "route": "JFK → LAX",
      "date": "2025-11-15",
      "passengers": 1
    },
    "results": {
      "flightsFound": 25,
      "sampleFlight": {...}
    }
  }
}
```

### 4. Run All Tests (Recommended)
```bash
curl -X GET http://localhost:5000/api/v1/sabre-test/all
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "All Sabre tests passed! ✅ Ready for integration!",
  "data": {
    "summary": {
      "totalTests": 3,
      "passed": 3,
      "allPassed": true
    },
    "results": {
      "authentication": { "success": true },
      "connection": { "success": true },
      "flightSearch": { "success": true }
    }
  }
}
```

---

## 🔍 What Each Test Does

### Authentication Test
- Requests OAuth2 token from Sabre
- Uses your `SABRE_CLIENT_ID` and `SABRE_CLIENT_SECRET`
- Caches token for 30 minutes
- Verifies credentials are valid

### Connection Test
- Gets authentication token
- Makes a simple API call to `/v1/lists/utilities/countries`
- Verifies API connectivity
- Returns sample country data

### Flight Search Test
- Gets authentication token
- Performs actual flight search (JFK → LAX)
- Tests the core flight booking API
- Returns flight results

---

## 🐛 Troubleshooting

### "Sabre Authentication Failed"
- Check your `SABRE_CLIENT_ID` and `SABRE_CLIENT_SECRET` in `.env`
- Verify credentials are for certification environment
- Check if credentials are active

### "Connection timeout"
- Verify `SABRE_BASE_URL` is correct
- Check internet connection
- Ensure firewall allows outbound HTTPS

### "Invalid request format"
- This indicates authentication works but API format needs adjustment
- Check Sabre API documentation for correct request structure

---

## 🎯 Quick Test Sequence

1. **Start server:** `npm run dev`
2. **Test all:** `curl -X GET http://localhost:5000/api/v1/sabre-test/all`
3. **Check results:** Look for "All Sabre tests passed! ✅"

If all tests pass, your Sabre integration is ready! 🚀

---

## 📊 Comparison with Amadeus

| Feature | Amadeus | Sabre |
|---------|---------|-------|
| **Auth** | OAuth2 Client Credentials | OAuth2 Client Credentials |
| **Token Cache** | 30 minutes | 30 minutes |
| **Test Endpoint** | `/api/v1/price-list/test` | `/api/v1/sabre-test/all` |
| **Flight Search** | `/v2/shopping/flight-offers` | `/v4/offers/shop` |
| **Environment** | Test/Production | Certification/Production |

Both APIs are now ready for testing! 🎉