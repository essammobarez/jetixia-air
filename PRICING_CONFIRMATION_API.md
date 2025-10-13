# ✅ Flight Pricing Confirmation API

## 🎯 Purpose

Get **confirmed actual prices** and **detailed flight information** before booking, including:

- Confirmed pricing (may differ from search results)
- Detailed fare rules and penalties
- Baggage allowances and fees
- Credit card fees
- Booking requirements
- Additional services

---

## 📍 Endpoints

1. **POST** `/api/v1/price-list/confirm` - Get confirmed pricing (live Amadeus API)
2. **GET** `/api/v1/price-list/test` - Get test pricing data (static mock data)

---

## 🔄 Use Case Flow

```
1. Search Flights
   POST /api/v1/price-list
   ↓
   Get list of flight offers

2. User Selects Flight
   ↓

3. Confirm Pricing ⭐
   POST /api/v1/price-list/confirm
   ↓
   Get actual confirmed price + details

4. Display to User
   - Confirmed price
   - Fare rules
   - Baggage info
   - Penalties

5. Proceed to Booking
```

---

## 📝 Request Body

```json
{
  "flightOffers": [
    // Copy the selected flight offer from /price-list response
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
      "itineraries": [...],
      "price": {...},
      "pricingOptions": {...},
      "validatingAirlineCodes": [...],
      "travelerPricings": [...]
    }
  ]
}
```

**Important:**

- The `flightOffers` array comes directly from the search API (`/api/v1/price-list`)
- You can pass 1-6 flight offers at once
- Just copy the complete flight offer object(s)

---

## 📤 Response Structure

```json
{
  "success": true,
  "message": "Flight pricing confirmed successfully!",
  "statusCode": 200,
  "data": {
    "data": {
      "type": "flight-offers-pricing",
      "flightOffers": [
        // Confirmed flight offer with actual prices
      ],
      "bookingRequirements": {
        "emailAddressRequired": true,
        "mobilePhoneNumberRequired": true,
        "travelerRequirements": [...]
      }
    },
    "included": {
      "detailed-fare-rules": {
        // Complete fare rules by segment
        "1": {
          "fareBasis": "SOW6AAUS",
          "name": "ONE WAY SPECIAL EXCURSION",
          "fareNotes": {
            "descriptions": [
              {
                "descriptionType": "PENALTIES",
                "text": "CHANGES: $150, CANCELLATIONS: $200..."
              }
            ]
          }
        }
      },
      "bags": {
        // Baggage options and prices
        "1": {
          "quantity": 1,
          "name": "CHECKED_BAG",
          "price": {
            "amount": "196.50",
            "currencyCode": "USD"
          }
        }
      },
      "credit-card-fees": {
        // Fees by card type
        "1": {
          "brand": "VISA",
          "amount": "0",
          "currency": "USD"
        }
      }
    },
    "dictionaries": {
      // Location and carrier information
    }
  }
}
```

---

## 📊 What You Get

### 1. Confirmed Pricing

- **Actual current price** (may have changed from search)
- Tax breakdown
- Fees breakdown
- Refundable taxes

### 2. Detailed Fare Rules

- Change penalties
- Cancellation penalties
- No-show penalties
- Refund conditions
- Ticket validity
- Fare restrictions

### 3. Baggage Information

- Included baggage allowance
- Additional baggage options
- Prices for extra bags
- Weight and dimension limits

### 4. Payment Information

- Credit card fees by brand
- Accepted payment methods
- Payment requirements

### 5. Booking Requirements

- Email address required?
- Phone number required?
- Travel documents required?
- Passenger information needed

---

## 💡 Example Requests

### Confirm Actual Pricing (Live API)

```bash
curl -X POST http://localhost:5000/api/v1/price-list/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffers": [
      {
        "type": "flight-offer",
        "id": "1",
        "source": "GDS",
        "itineraries": [...],
        "price": {...},
        "travelerPricings": [...]
      }
    ]
  }'
```

### Get Test Data (Mock) ⭐

```bash
curl -X GET http://localhost:5000/api/v1/price-list/test
```

**No request body needed!** Returns static test data for:

- Frontend development
- Testing UI components
- API integration testing
- Demo purposes

---

## ⚠️ Important Notes

### Price Changes

- Prices can change between search and confirmation
- Always confirm pricing before booking
- Handle 409 Conflict error (price changed)

### Flight Availability

- Seats may sell out between search and confirmation
- Handle 404 Not Found error (flight no longer available)

### Multiple Offers

- You can confirm up to 6 flight offers at once
- Useful for comparing multiple selected flights
- Each offer is priced independently

---

## 🔍 Use Cases

### 1. Pre-Booking Confirmation

```javascript
// User clicks "Select Flight"
const selectedFlight = searchResults.data[0];

// Confirm actual pricing
const confirmation = await fetch("/api/v1/price-list/confirm", {
  method: "POST",
  body: JSON.stringify({
    flightOffers: [selectedFlight],
  }),
});

// Display confirmed price and details
displayPriceBreakdown(confirmation.data.flightOffers[0].price);
displayFareRules(confirmation.included["detailed-fare-rules"]);
displayBaggageOptions(confirmation.included.bags);
```

### 2. Compare Multiple Flights

```javascript
// User selects 3 flights to compare
const selectedFlights = [flight1, flight2, flight3];

// Get confirmed pricing for all
const comparison = await fetch("/api/v1/price-list/confirm", {
  method: "POST",
  body: JSON.stringify({
    flightOffers: selectedFlights,
  }),
});

// Show side-by-side comparison with actual prices
```

### 3. Show Fare Rules

```javascript
// Before booking, show user the penalties
const fareRules = confirmation.included["detailed-fare-rules"];

// Extract penalties
const penalties = fareRules["1"].fareNotes.descriptions.find(
  (d) => d.descriptionType === "PENALTIES"
);

// Display to user
alert(`Change Fee: $150\nCancel Fee: $200\nNo-Show: $300`);
```

---

## ❌ Error Handling

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid flight offer data or pricing request",
  "statusCode": 400
}
```

**Cause:** Invalid flight offer format or missing required fields

### 409 Conflict

```json
{
  "success": false,
  "message": "Flight offer price has changed or is no longer available",
  "statusCode": 409
}
```

**Cause:** Price changed since search, show updated price to user

### 404 Not Found

```json
{
  "success": false,
  "message": "Flight offer not found or no longer available",
  "statusCode": 404
}
```

**Cause:** Flight sold out or no longer available

---

## 🎯 Best Practices

### 1. Always Confirm Before Booking

```javascript
// ❌ Bad: Book directly from search results
bookFlight(searchResults.data[0]);

// ✅ Good: Confirm pricing first
const confirmed = await confirmPricing(searchResults.data[0]);
bookFlight(confirmed.data.flightOffers[0]);
```

### 2. Handle Price Changes

```javascript
try {
  const confirmed = await confirmPricing(selectedFlight);

  if (confirmed.price.total !== selectedFlight.price.total) {
    // Alert user about price change
    alert(`Price updated: ${confirmed.price.total}`);
  }
} catch (error) {
  if (error.statusCode === 409) {
    // Price changed - show new price
    showPriceChangeMessage();
  }
}
```

### 3. Show Important Information

- ✅ Display fare rules before booking
- ✅ Show baggage allowance clearly
- ✅ Highlight change/cancel penalties
- ✅ Show booking requirements

### 4. Cache Confirmation

```javascript
// Cache for 5 minutes to avoid repeated API calls
const cacheKey = `pricing_${flightId}`;
const cached = cache.get(cacheKey);

if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.data;
}

const confirmed = await confirmPricing(flight);
cache.set(cacheKey, { data: confirmed, timestamp: Date.now() });
```

---

## 📚 Related Documentation

- **Search API:** `src/app/modules/price-list/README.md`
- **UI Design:** `UI_DESIGN_GUIDE.md`
- **Setup:** `AMADEUS_PRICE_LIST_SETUP.md`

---

## ✨ Summary

| Feature           | Details                           |
| ----------------- | --------------------------------- |
| **Endpoint**      | POST `/api/v1/price-list/confirm` |
| **Input**         | Flight offers from search API     |
| **Output**        | Confirmed pricing + detailed info |
| **Max Offers**    | 6 flight offers per request       |
| **Response Time** | ~1-3 seconds                      |
| **Use When**      | Before booking, to confirm price  |
| **Key Benefit**   | Get actual price + fare rules     |

**Always confirm pricing before booking to ensure accurate prices and show detailed information to users!** 🎯
