# 🧪 Test Endpoints - Quick Reference

## 📍 Test Endpoint

**GET** `/api/v1/price-list/test`

Returns complete mock pricing confirmation data with all enrichments.

---

## 🚀 Quick Test

```bash
# Start server
npm run dev

# Call test endpoint (instant response, no auth needed!)
curl http://localhost:5000/api/v1/price-list/test
```

---

## 📊 Response Structure

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Flight pricing confirmed successfully!",
  "data": {
    "data": {
      "type": "flight-offers-pricing",
      "flightOffers": [
        {
          "type": "flight-offer",
          "id": "1",
          "source": "GDS",
          "price": {
            "currency": "USD",
            "total": "248.50",
            "base": "78.00",
            "grandTotal": "248.50"
          },
          "itineraries": [
            {
              "segments": [
                {
                  "departure": {
                    "iataCode": "SYD",
                    "terminal": "1",
                    "at": "2025-11-02T12:30:00",
                    "airportName": "SYDNEY KINGSFORD SMITH", // ⭐ Enriched
                    "cityName": "SYDNEY", // ⭐ Enriched
                    "countryName": "AUSTRALIA" // ⭐ Enriched
                  },
                  "arrival": {
                    "iataCode": "XMN",
                    "terminal": "3",
                    "at": "2025-11-02T18:55:00",
                    "airportName": "GAOQI INTL", // ⭐ Enriched
                    "cityName": "XIAMEN", // ⭐ Enriched
                    "countryName": "CHINA" // ⭐ Enriched
                  },
                  "carrierCode": "MF",
                  "carrierName": "XIAMEN AIRLINES", // ⭐ Enriched
                  "operating": {
                    "carrierCode": "MF",
                    "carrierName": "XIAMEN AIRLINES" // ⭐ Enriched
                  }
                }
              ]
            }
          ]
        }
      ],
      "bookingRequirements": {
        "emailAddressRequired": true,
        "mobilePhoneNumberRequired": true
      }
    },
    "included": {
      "detailed-fare-rules": {
        /* Complete fare rules */
      },
      "bags": {
        /* Baggage options */
      },
      "credit-card-fees": {
        /* Card fees */
      }
    },
    "dictionaries": {
      "locations": {
        /* Location info */
      }
    }
  }
}
```

---

## ✨ What's Included in Test Data

### ✅ Flight Information

- **Route:** SYD → XMN → BKK
- **Airline:** Xiamen Airlines (MF)
- **Duration:** 16h 15m
- **Price:** $248.50 USD
- **Segments:** 2 (with 1 layover in Xiamen)

### ✅ Enriched Data

- **Airline Names:** "XIAMEN AIRLINES" (both segments)
- **Airport Names:** Full names for all airports
- **City Names:** Sydney, Xiamen, Bangkok
- **Country Names:** Australia, China, Thailand

### ✅ Detailed Information

- **Fare Rules:** Complete penalties and conditions
- **Change Fee:** $150
- **Cancel Fee:** $200 (before departure)
- **No-Show Fee:** $300

### ✅ Baggage Options

- **Option 1:** 1 checked bag - $196.50
- **Option 2:** 2 checked bags - $393.00
- **Included:** 1 checked bag (23kg, 158cm)

### ✅ Credit Card Fees

- VISA: $0
- Mastercard: $0
- American Express: $0
- All major cards: $0

### ✅ Booking Requirements

- Email address: Required
- Mobile phone: Required
- Travel documents: Required

---

## 🎯 Use Cases for Test Endpoint

### 1. Frontend Development

```javascript
// Develop UI without waiting for real API
const response = await fetch('/api/v1/price-list/test');
const data = await response.json();

// Use data to build components
<FlightCard offer={data.data.data.flightOffers[0]} />
<FareRules rules={data.data.included['detailed-fare-rules']} />
<BaggageOptions bags={data.data.included.bags} />
```

### 2. UI/UX Testing

- Test how UI handles long fare rule texts
- Test baggage option displays
- Test credit card fee UI
- Test booking requirements flow

### 3. Integration Testing

```javascript
describe("Flight Pricing Display", () => {
  it("should display enriched airport names", async () => {
    const data = await fetch("/api/v1/price-list/test");
    expect(data.departure.airportName).toBe("SYDNEY KINGSFORD SMITH");
    expect(data.departure.cityName).toBe("SYDNEY");
  });
});
```

### 4. Demo & Presentation

- Show stakeholders the complete data structure
- Demo UI without API credentials
- Present without internet connection
- Quick prototyping

---

## 💡 Development Workflow

```
Phase 1: Build UI with Test Data
   ↓
GET /api/v1/price-list/test
   ↓
Build all UI components
Test all user interactions
   ↓
Phase 2: Integrate Live API
   ↓
Replace with POST /api/v1/price-list
and POST /api/v1/price-list/confirm
   ↓
Same data structure!
No UI changes needed!
```

---

## 🎨 Example: Display Test Data

### Flight Route Display

```javascript
const segment = testData.data.data.flightOffers[0].itineraries[0].segments[0];

console.log(`${segment.departure.cityName} → ${segment.arrival.cityName}`);
// Output: "SYDNEY → XIAMEN"

console.log(`${segment.departure.airportName} (${segment.departure.iataCode})`);
// Output: "SYDNEY KINGSFORD SMITH (SYD)"

console.log(`Operated by: ${segment.carrierName}`);
// Output: "Operated by: XIAMEN AIRLINES"
```

### Price Breakdown

```javascript
const price = testData.data.data.flightOffers[0].price;
const taxes =
  testData.data.data.flightOffers[0].travelerPricings[0].price.taxes;

console.log(`Base: $${price.base}`); // $78.00
console.log(`Total: $${price.total}`); // $248.50

taxes.forEach((tax) => {
  console.log(`${tax.code}: $${tax.amount}`);
});
```

### Fare Rules

```javascript
const fareRules = testData.data.included["detailed-fare-rules"];

Object.values(fareRules).forEach((rule) => {
  const penalties = rule.fareNotes.descriptions.find(
    (d) => d.descriptionType === "PENALTIES"
  );

  console.log(penalties.text);
  // Shows: "CHANGES: $150, CANCELLATIONS: $200, NO-SHOW: $300"
});
```

---

## ✅ Benefits

### For Developers

- 🚀 **Instant Response** - No waiting for API calls
- 🔓 **No Auth Required** - Work without Amadeus credentials
- 📱 **Offline Development** - Work without internet
- 🎯 **Consistent Data** - Same structure every time

### For Testing

- ✅ **Predictable** - Same data for automated tests
- ✅ **Complete** - All fields populated
- ✅ **Realistic** - Real-world data structure
- ✅ **Fast** - No API delays

### For Demos

- 🎭 **Reliable** - Always works
- 🎬 **Professional** - Complete data
- 🌐 **No Dependencies** - Works anywhere
- ⚡ **Instant** - No loading time

---

## 🔍 Data Verification Checklist

When testing with `/test` endpoint, verify:

- [ ] Departure has `airportName`, `cityName`, `countryName`
- [ ] Arrival has `airportName`, `cityName`, `countryName`
- [ ] Segments have `carrierName`
- [ ] Operating carrier has `carrierName`
- [ ] Price is in USD
- [ ] Fare rules are complete
- [ ] Baggage options are present
- [ ] Credit card fees are included
- [ ] Booking requirements are specified

---

## 🎯 Quick Summary

| Feature           | Value                         |
| ----------------- | ----------------------------- |
| **Endpoint**      | GET `/api/v1/price-list/test` |
| **Method**        | GET                           |
| **Auth Required** | No                            |
| **Response Time** | Instant (~1ms)                |
| **Data Source**   | Static mock data              |
| **Enrichment**    | All (airlines + airports)     |
| **Use For**       | Development, testing, demos   |

---

**Perfect for getting started without setting up Amadeus credentials!** 🚀

Test it now:

```bash
npm run dev
curl http://localhost:5000/api/v1/price-list/test
```
