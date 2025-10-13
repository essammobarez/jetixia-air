# ✈️ Airport Information Enrichment Feature

## 🎉 New Feature Added!

The Price List API now automatically enriches airport codes with detailed airport information!

---

## 🎯 What Was Added

### Airport IATA codes are now enriched with:

- ✅ **Airport Name** - Full airport name
- ✅ **City Name** - City where airport is located
- ✅ **Country Name** - Country name
- ✅ **Country Code** - ISO country code

---

## 📊 Before vs After

### Before (Only IATA Code)

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

### After (With Full Airport Information) ⭐

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

---

## 🚀 How It Works

### 1. Automatic Extraction

```
API collects all unique airport codes from:
- Departure airports
- Arrival airports
- All segments in itineraries
```

### 2. Parallel Fetching

```
Makes parallel API calls to Amadeus Location API:
GET /v1/reference-data/locations?subType=AIRPORT&keyword=SYD
GET /v1/reference-data/locations?subType=AIRPORT&keyword=BKK
GET /v1/reference-data/locations?subType=AIRPORT&keyword=XMN
```

### 3. Caching

```
Stores airport information in memory cache:
- SYD → "Sydney Kingsford Smith, Sydney, Australia"
- BKK → "Suvarnabhumi, Bangkok, Thailand"
- XMN → "Gaoqi International, Xiamen, China"
```

### 4. Enrichment

```
Adds airport details to every departure and arrival in response
```

---

## ⚡ Performance

### Optimizations:

- **In-Memory Cache**: Airport data cached after first lookup
- **Parallel Fetching**: All airports fetched simultaneously
- **Automatic Reuse**: Common airports (SYD, BKK, etc.) only fetched once

### Example Performance:

```
First request (10 flights, 5 unique airports):
- 5 airport API calls
- ~500ms for airport data

Subsequent requests:
- 0 airport API calls (cached!)
- ~0ms for airport data
```

---

## 🎨 UI Display Benefits

### Now You Can Show:

**Simple:**

```
Sydney → Bangkok
```

**Detailed:**

```
Sydney Kingsford Smith Airport (SYD)
  ↓
Suvarnabhumi Airport (BKK)
```

**With Country:**

```
🛫 Sydney, Australia
🛬 Bangkok, Thailand
```

**Full Rich Display:**

```
┌────────────────────────────────────┐
│ Departure                          │
│ Sydney Kingsford Smith Airport     │
│ Sydney, Australia (SYD)            │
│ Terminal 1                         │
│ Nov 2, 2025 at 12:30 PM           │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Arrival                            │
│ Suvarnabhumi Airport               │
│ Bangkok, Thailand (BKK)            │
│ Nov 3, 2025 at 12:45 AM           │
└────────────────────────────────────┘
```

---

## 📝 API Response Structure

### Complete Segment with All Enrichments:

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
  },
  "carrierCode": "MF",
  "carrierName": "XIAMEN AIRLINES",
  "number": "802",
  "aircraft": {
    "code": "789"
  },
  "operating": {
    "carrierCode": "MF",
    "carrierName": "XIAMEN AIRLINES"
  },
  "duration": "PT9H25M"
}
```

---

## 🔧 Technical Details

### Amadeus API Used:

- **API:** Airport & City Search (Location API)
- **Endpoint:** `GET /v1/reference-data/locations`
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-and-city-search

### Implementation:

- **File:** `src/app/modules/price-list/priceList.service.ts`
- **Function:** `getAirportInfo()`
- **Cache:** `Map<string, AirportInfo>`

### Data Structure:

```typescript
interface AirportInfo {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
  countryCode: string;
}
```

---

## ✨ Benefits

### For Users:

- 🎯 **Better Readability**: See actual airport names, not just codes
- 🌍 **Clear Locations**: Know exactly which city and country
- 📱 **Better UX**: More informative flight details

### For Developers:

- 🚀 **Automatic**: No manual mapping needed
- ⚡ **Fast**: Cached for performance
- 🔄 **Consistent**: Always up-to-date from Amadeus
- 🛠️ **Easy to Use**: Just use the API, enrichment is automatic

### For Business:

- 💎 **Professional**: High-quality data presentation
- 🌐 **Global**: Supports all airports worldwide
- 📊 **Complete**: Comprehensive airport information

---

## 🎯 What's Enriched

### ✅ Already Enriched:

- Airline carrier codes → Business names (e.g., "MF" → "XIAMEN AIRLINES")
- Airport IATA codes → Full airport information ⭐ NEW

### ❌ NOT Enriched (By Design):

- Aircraft codes (stays as "789", not "Boeing 787-9")
  - Reason: Keep response clean, convert in frontend if needed

---

## 📋 Example API Call

### Request:

```bash
POST /api/v1/price-list
{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "adults": 1
}
```

### Response Includes:

```json
{
  "data": {
    "data": [
      {
        "itineraries": [
          {
            "segments": [
              {
                "departure": {
                  "iataCode": "SYD",
                  "airportName": "SYDNEY KINGSFORD SMITH", // ⭐ Added
                  "cityName": "SYDNEY", // ⭐ Added
                  "countryName": "AUSTRALIA" // ⭐ Added
                },
                "arrival": {
                  "iataCode": "BKK",
                  "airportName": "SUVARNABHUMI", // ⭐ Added
                  "cityName": "BANGKOK", // ⭐ Added
                  "countryName": "THAILAND" // ⭐ Added
                },
                "carrierCode": "MF",
                "carrierName": "XIAMEN AIRLINES" // ✅ Already had
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

## 🚀 Usage in Frontend

### Display Airport Name:

```javascript
const segment = flight.itineraries[0].segments[0];

// Simple
console.log(segment.departure.airportName); // "SYDNEY KINGSFORD SMITH"

// With City
console.log(`${segment.departure.cityName} (${segment.departure.iataCode})`);
// "SYDNEY (SYD)"

// Full
console.log(
  `${segment.departure.airportName}, ${segment.departure.cityName}, ${segment.departure.countryName}`
);
// "SYDNEY KINGSFORD SMITH, SYDNEY, AUSTRALIA"
```

### Display in UI:

```jsx
<div className="flight-route">
  <div className="departure">
    <span className="airport">{segment.departure.airportName}</span>
    <span className="city">
      {segment.departure.cityName}, {segment.departure.countryName}
    </span>
    <span className="code">({segment.departure.iataCode})</span>
  </div>
  <div className="arrow">→</div>
  <div className="arrival">
    <span className="airport">{segment.arrival.airportName}</span>
    <span className="city">
      {segment.arrival.cityName}, {segment.arrival.countryName}
    </span>
    <span className="code">({segment.arrival.iataCode})</span>
  </div>
</div>
```

---

## 🎉 Summary

**Airport enrichment is now live!** Every flight search automatically includes:

- ✅ Airline business names
- ✅ Airport names
- ✅ City names
- ✅ Country names

**No changes needed in your frontend code** - the data is automatically included in all API responses! 🚀

Just use the new fields (`airportName`, `cityName`, `countryName`) to display richer information to your users!
