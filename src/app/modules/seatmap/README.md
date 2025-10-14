# 💺 SeatMap API - Get Aircraft Seat Maps

## Overview

The SeatMap API allows you to retrieve detailed seat maps for flights, showing seat availability, positions, features, and pricing. This enables customers to select specific seats during the booking process.

**Base Endpoint:** `POST /api/v1/seatmap`

---

## 🎯 Features

✅ **Real-time seat availability** - See which seats are available, occupied, or blocked  
✅ **Seat pricing** - Free standard seats vs. premium paid seats  
✅ **Seat characteristics** - Window, aisle, middle, exit row, extra legroom  
✅ **Per-segment maps** - Different seat map for each flight leg  
✅ **Aircraft layout** - Deck configuration, facilities, wing positions  
✅ **Per-traveler pricing** - Different prices for different travelers

---

## 📋 API Endpoints

### 1. Get Seat Maps

**Endpoint:** `POST /api/v1/seatmap`

**Description:** Retrieve seat maps for one or more flight offers.

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
      "itineraries": [
        {
          "segments": [
            {
              "departure": {
                "iataCode": "SYD",
                "at": "2025-11-02T12:30:00"
              },
              "arrival": {
                "iataCode": "XMN",
                "at": "2025-11-02T18:55:00"
              },
              "carrierCode": "MF",
              "number": "802",
              "aircraft": {
                "code": "789"
              },
              "id": "25"
            }
          ]
        }
      ],
      "price": {
        /* ... */
      },
      "pricingOptions": {
        /* ... */
      },
      "validatingAirlineCodes": ["MF"],
      "travelerPricings": [
        {
          "travelerId": "1",
          "fareOption": "STANDARD",
          "travelerType": "ADULT"
        }
      ]
    }
  ]
}
```

**Note:** Pass the complete flight offer from the `/price-list/confirm` API.

#### Response

```json
{
  "success": true,
  "message": "Seat maps retrieved successfully!",
  "statusCode": 200,
  "data": {
    "meta": {
      "count": 1,
      "links": {
        "self": "https://test.api.amadeus.com/v1/shopping/seatmaps"
      }
    },
    "data": [
      {
        "type": "seatmap",
        "flightOfferId": "1",
        "segmentId": "25",
        "carrierCode": "MF",
        "number": "802",
        "aircraft": {
          "code": "789"
        },
        "departure": {
          "iataCode": "SYD",
          "at": "2025-11-02T12:30:00"
        },
        "arrival": {
          "iataCode": "XMN",
          "at": "2025-11-02T18:55:00"
        },
        "class": "ECONOMY",
        "deckConfiguration": {
          "width": 9,
          "length": 30,
          "startWing": 8,
          "endWing": 20,
          "startSeatRow": 1,
          "endSeatRow": 30,
          "exitRowsX": [12, 26]
        },
        "decks": [
          {
            "deckType": "MAIN",
            "deckConfiguration": {
              "width": 9,
              "length": 30
            },
            "seats": [
              {
                "cabin": "ECONOMY",
                "number": "1A",
                "characteristicsCodes": ["W", "1"],
                "travelerPricing": [
                  {
                    "travelerId": "1",
                    "seatAvailabilityStatus": "AVAILABLE",
                    "price": {
                      "currency": "USD",
                      "total": "0.00"
                    }
                  }
                ],
                "coordinates": {
                  "x": 1,
                  "y": 1
                }
              },
              {
                "cabin": "ECONOMY",
                "number": "12A",
                "characteristicsCodes": ["W", "E", "L"],
                "travelerPricing": [
                  {
                    "travelerId": "1",
                    "seatAvailabilityStatus": "AVAILABLE",
                    "price": {
                      "currency": "USD",
                      "total": "50.00"
                    }
                  }
                ],
                "coordinates": {
                  "x": 1,
                  "y": 12
                }
              },
              {
                "cabin": "ECONOMY",
                "number": "12B",
                "characteristicsCodes": ["M"],
                "travelerPricing": [
                  {
                    "travelerId": "1",
                    "seatAvailabilityStatus": "OCCUPIED"
                  }
                ]
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

## 🪑 Seat Characteristics

### Position Codes

| Code | Description |
| ---- | ----------- |
| `W`  | Window seat |
| `A`  | Aisle seat  |
| `M`  | Middle seat |

### Feature Codes

| Code | Description                        |
| ---- | ---------------------------------- |
| `E`  | Exit row seat                      |
| `L`  | Leg space seat (extra legroom)     |
| `Q`  | Bulkhead seat                      |
| `1`  | Suitable for passenger with infant |
| `9`  | Not suitable for child/infant      |
| `CH` | Chargeable seat                    |
| `RS` | Restricted recline                 |
| `K`  | Blocked seat                       |

### Availability Status

| Status      | Description                      |
| ----------- | -------------------------------- |
| `AVAILABLE` | Seat can be selected             |
| `OCCUPIED`  | Seat is already taken            |
| `BLOCKED`   | Seat not available for selection |

---

## 💰 Seat Pricing

### Free Standard Seats

```json
{
  "number": "20B",
  "characteristicsCodes": ["M"],
  "travelerPricing": [
    {
      "travelerId": "1",
      "seatAvailabilityStatus": "AVAILABLE",
      "price": {
        "currency": "USD",
        "total": "0.00"
      }
    }
  ]
}
```

### Premium Paid Seats

```json
{
  "number": "12A",
  "characteristicsCodes": ["W", "E", "L"],
  "travelerPricing": [
    {
      "travelerId": "1",
      "seatAvailabilityStatus": "AVAILABLE",
      "price": {
        "currency": "USD",
        "total": "50.00"
      }
    }
  ]
}
```

**Pricing factors:**

- Window/Aisle seats may be free or premium
- Exit row seats usually cost more ($30-$80)
- Extra legroom seats ($20-$100)
- Bulkhead seats ($20-$50)

---

## 🔄 Complete Workflow

### Step 1: Search Flights

```http
POST /api/v1/price-list
```

### Step 2: Confirm Pricing

```http
POST /api/v1/price-list/confirm
```

### Step 3: Get Seat Maps

```http
POST /api/v1/seatmap

{
  "flightOffers": [
    /* Use flight offer from Step 2 */
  ]
}
```

### Step 4: Book with Seat Selection

```http
POST /api/v1/booking/create

{
  "flightOffer": { /* ... */ },
  "travelers": [ /* ... */ ],
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
    },
    {
      "segmentId": "26",
      "travelerIds": ["1"],
      "number": "15F"
    }
  ],
  "instantTicketing": true
}
```

---

## ⚠️ Important Notes

### Airline Support

- ❌ Not all airlines provide seat maps via GDS
- ❌ Some airlines only allow seat selection on their website
- ❌ Budget carriers often charge separately for seats

### Availability

- ⚠️ Seats can be taken while user is selecting
- ⚠️ Booking may fail if seat becomes unavailable
- ✅ Always confirm seat availability before booking

### Multi-Segment Flights

- Each flight segment has its own seat map
- Must select seats separately for each segment
- Segment IDs match those in the flight offer

### Seat Selection Timing

- Can select during initial booking ✅
- Can change after booking (with some airlines) ⚠️
- Some airlines restrict changes ❌

---

## 🎨 UI Display Recommendations

### Seat Map Layout

```
Aircraft: Boeing 787-9 (789)
Flight: MF 802 | SYD → XMN
Cabin: Economy

           A   B   C       D   E   F       G   H   J
Row 1     [W] [M] [A]     [A] [M] [W]     [A] [M] [W]
Row 2     [W] [M] [A]     [A] [X] [W]     [A] [M] [W]
...
Row 12    [$] [X] [$]     [$] [X] [$]     [$] [$] [X]  (EXIT)
...
Row 30    [W] [M] [A]     [A] [M] [W]     [A] [M] [W]

Legend:
[W] Available Window - Free
[M] Available Middle - Free
[A] Available Aisle - Free
[$] Premium Seat - $50
[X] Occupied/Blocked
```

### Seat Legend

Display seat characteristics to users:

- 🪟 **Window** - Great views
- 🚪 **Aisle** - Easy access
- 🔲 **Middle** - Between window & aisle
- 🚪➡️ **Exit Row** - Extra legroom, restrictions apply
- 🦵 **Extra Legroom** - More space
- 💵 **Premium** - Additional fee
- ❌ **Unavailable** - Already taken or blocked

### Pricing Display

```
Standard Seats: Free ✅
Exit Row Window: +$50
Exit Row Aisle: +$40
Exit Row Middle: +$30
Extra Legroom: +$25
```

---

## 🚨 Error Handling

### 404 - Seat Map Not Available

```json
{
  "success": false,
  "message": "Seat map not available for this flight. The airline may not provide seat maps via this channel.",
  "statusCode": 404
}
```

**Reason:** Airline doesn't provide seat maps via Amadeus GDS.

### 400 - Invalid Request

```json
{
  "success": false,
  "message": "Invalid flight offer data for seat map request",
  "statusCode": 400
}
```

**Reason:** Flight offer structure is invalid or incomplete.

### 401 - Authentication Failed

```json
{
  "success": false,
  "message": "Authentication failed with Amadeus API.",
  "statusCode": 401
}
```

**Reason:** Amadeus API credentials are invalid or expired.

---

## 📊 Response Data Structure

### Seat Object

```typescript
interface Seat {
  cabin: string; // "ECONOMY", "BUSINESS", "FIRST"
  number: string; // "12A", "15F"
  characteristicsCodes: string[]; // ["W", "E", "L"]
  travelerPricing: Array<{
    travelerId: string;
    seatAvailabilityStatus: "AVAILABLE" | "OCCUPIED" | "BLOCKED";
    price?: {
      currency: string;
      total: string;
    };
  }>;
  coordinates?: {
    x: number; // Column position
    y: number; // Row position
  };
}
```

### Deck Configuration

```typescript
interface DeckConfiguration {
  width: number; // Number of seats per row
  length: number; // Number of rows
  startSeatRow: number; // First row number
  endSeatRow: number; // Last row number
  startWing?: number; // Wing start row
  endWing?: number; // Wing end row
  exitRowsX?: number[]; // Exit row numbers
}
```

---

## 🔗 Integration with Booking API

### Booking Request with Seat Selection

The booking API now accepts `seatSelections` parameter:

```json
{
  "flightOffer": {
    /* ... */
  },
  "travelers": [
    /* ... */
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
      "segmentId": "25", // From flight offer
      "travelerIds": ["1"], // Traveler ID
      "number": "12A" // Seat number from seatmap
    }
  ]
}
```

### Seat Selection Validation

- ✅ Seat number format: `[0-9]{1,3}[A-K]` (e.g., 12A, 15F, 1A)
- ✅ Segment ID must match flight offer segment
- ✅ Traveler IDs must match booking travelers
- ✅ Each traveler can have one seat per segment

---

## 📱 Example Frontend Flow

### React Component Example

```jsx
// 1. Get seat maps after pricing confirmation
const seatMapResponse = await fetch('/api/v1/seatmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flightOffers: [confirmedFlightOffer]
  })
});

const { data } = await seatMapResponse.json();

// 2. Display seat map for each segment
data.data.forEach(seatMap => {
  console.log(`Flight ${seatMap.number} - Segment ${seatMap.segmentId}`);

  seatMap.decks[0].seats.forEach(seat => {
    const status = seat.travelerPricing[0].seatAvailabilityStatus;
    const price = seat.travelerPricing[0].price?.total || '0.00';

    console.log(`Seat ${seat.number}: ${status} - $${price}`);
  });
});

// 3. User selects seats
const selectedSeats = [
  { segmentId: '25', travelerIds: ['1'], number: '12A' },
  { segmentId: '26', travelerIds: ['1'], number: '15F' }
];

// 4. Create booking with seat selections
const bookingResponse = await fetch('/api/v1/booking/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flightOffer: confirmedFlightOffer,
    travelers: [...],
    contactEmail: 'customer@example.com',
    contactPhone: '1234567890',
    contactPhoneCountryCode: '1',
    address: {...},
    seatSelections: selectedSeats,
    instantTicketing: true
  })
});
```

---

## ✅ Testing

### Test with Postman

1. **Get pricing confirmation:**

   ```
   POST /api/v1/price-list/confirm
   ```

2. **Copy flight offer from response**

3. **Get seat maps:**

   ```http
   POST /api/v1/seatmap

   {
     "flightOffers": [/* paste flight offer */]
   }
   ```

4. **Select seats from response**

5. **Book with seats:**

   ```http
   POST /api/v1/booking/create

   {
     "flightOffer": { /* ... */ },
     "seatSelections": [
       {
         "segmentId": "25",
         "travelerIds": ["1"],
         "number": "12A"
       }
     ],
     /* ... other fields */
   }
   ```

---

## 🎯 Summary

✅ **SeatMap API** - Get detailed seat availability and pricing  
✅ **Per-segment** - Different map for each flight leg  
✅ **Real-time** - Current seat availability  
✅ **Seat features** - Window, aisle, exit row, legroom  
✅ **Pricing** - Free standard vs. premium paid seats  
✅ **Booking integration** - Select seats during booking

---

**Need Help?** Check the [Amadeus SeatMap API Documentation](https://developers.amadeus.com/self-service/category/flights/api-doc/seatmap-display)
