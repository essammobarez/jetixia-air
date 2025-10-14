# 💺 SeatMap API - Complete Implementation Guide

## 🎉 What's New

✅ **SeatMap API** - Get detailed seat maps for flights  
✅ **Seat Selection in Booking** - Pre-select seats during booking  
✅ **Real-time Availability** - See which seats are available  
✅ **Seat Pricing** - Free standard vs. premium paid seats  
✅ **Per-segment Maps** - Different seat map for each flight leg

---

## 📍 API Endpoints

### 1. Get Seat Maps

**POST** `/api/v1/seatmap`

Get detailed seat availability, positions, features, and pricing for flights.

### 2. Create Booking (Updated)

**POST** `/api/v1/booking/create`

Now supports optional seat selections during booking.

---

## 🔄 Complete User Flow

### Step 1: Search Flights

```http
POST /api/v1/price-list

{
  "originLocationCode": "SYD",
  "destinationLocationCode": "BKK",
  "departureDate": "2025-11-02",
  "adults": 1,
  "travelClass": "ECONOMY"
}
```

### Step 2: Confirm Pricing

```http
POST /api/v1/price-list/confirm

{
  "flightOffers": [
    /* Selected flight offer from Step 1 */
  ]
}
```

### Step 3: Get Seat Maps (New!)

```http
POST /api/v1/seatmap

{
  "flightOffers": [
    /* Flight offer from Step 2 */
  ]
}
```

**Response includes:**

- Available seats, occupied seats, blocked seats
- Seat positions (window, aisle, middle)
- Seat features (exit row, extra legroom)
- Seat pricing (free vs. premium)
- Aircraft layout and configuration

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

## 💺 SeatMap API Details

### Request Format

```json
{
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
}
```

**Important:** Use the complete flight offer from `/price-list/confirm`

### Response Format

```json
{
  "success": true,
  "message": "Seat maps retrieved successfully!",
  "statusCode": 200,
  "data": {
    "meta": {
      "count": 1
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
        "decks": [
          {
            "deckType": "MAIN",
            "seats": [
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

## 🪑 Seat Information

### Seat Characteristics

| Code         | Description            |
| ------------ | ---------------------- |
| **Position** |                        |
| `W`          | Window seat            |
| `A`          | Aisle seat             |
| `M`          | Middle seat            |
| **Features** |                        |
| `E`          | Exit row seat          |
| `L`          | Extra leg space        |
| `Q`          | Bulkhead seat          |
| `1`          | Suitable for infant    |
| `9`          | Not suitable for child |
| `CH`         | Chargeable seat        |
| `RS`         | Restricted recline     |
| `K`          | Blocked seat           |

### Availability Status

| Status      | Description        | Can Select? |
| ----------- | ------------------ | ----------- |
| `AVAILABLE` | Seat is available  | ✅ Yes      |
| `OCCUPIED`  | Seat already taken | ❌ No       |
| `BLOCKED`   | Seat not available | ❌ No       |

### Seat Pricing

**Free Standard Seats:**

```json
{
  "number": "20B",
  "price": {
    "currency": "USD",
    "total": "0.00"
  }
}
```

**Premium Paid Seats:**

```json
{
  "number": "12A",
  "characteristicsCodes": ["W", "E", "L"],
  "price": {
    "currency": "USD",
    "total": "50.00"
  }
}
```

**Typical Pricing:**

- Standard seats: **Free**
- Exit row window: **$40-$80**
- Exit row aisle: **$30-$60**
- Extra legroom: **$20-$50**
- Bulkhead seats: **$20-$40**

---

## 🔧 Booking with Seat Selection

### Updated Booking Request

The booking API now accepts `seatSelections` parameter:

```json
{
  "flightOffer": {
    /* ... */
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
  ]
}
```

### Seat Selection Parameters

| Field         | Type     | Required | Description                         |
| ------------- | -------- | -------- | ----------------------------------- |
| `segmentId`   | string   | ✅ Yes   | Flight segment ID from flight offer |
| `travelerIds` | string[] | ✅ Yes   | Array of traveler IDs               |
| `number`      | string   | ✅ Yes   | Seat number (e.g., "12A", "15F")    |

### Validation Rules

✅ **Seat number format:** `[0-9]{1,3}[A-K]` (e.g., 12A, 15F, 1A)  
✅ **Segment ID** must exist in flight offer  
✅ **Traveler IDs** must match booking travelers  
✅ **One seat per traveler per segment**

---

## 🎨 Frontend Implementation

### React Example

```jsx
import { useState } from 'react';

function FlightBooking() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMaps, setSeatMaps] = useState([]);

  // Step 1: Get seat maps after pricing confirmation
  const fetchSeatMaps = async (flightOffer) => {
    const response = await fetch('/api/v1/seatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightOffers: [flightOffer] })
    });

    const { data } = await response.json();
    setSeatMaps(data.data);
  };

  // Step 2: Display seat map
  const renderSeatMap = (seatMap) => {
    return (
      <div className="seat-map">
        <h3>Flight {seatMap.number} - {seatMap.departure.iataCode} → {seatMap.arrival.iataCode}</h3>
        <div className="seats-grid">
          {seatMap.decks[0].seats.map(seat => {
            const travelerPricing = seat.travelerPricing[0];
            const isAvailable = travelerPricing.seatAvailabilityStatus === 'AVAILABLE';
            const price = travelerPricing.price?.total || '0.00';

            return (
              <button
                key={seat.number}
                disabled={!isAvailable}
                className={`seat ${getSeatClass(seat)}`}
                onClick={() => handleSeatSelect(seatMap.segmentId, seat.number)}
              >
                {seat.number}
                {price !== '0.00' && <span className="price">${price}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 3: Handle seat selection
  const handleSeatSelect = (segmentId, seatNumber) => {
    setSelectedSeats(prev => [
      ...prev.filter(s => s.segmentId !== segmentId),
      {
        segmentId,
        travelerIds: ['1'],
        number: seatNumber
      }
    ]);
  };

  // Step 4: Create booking with seats
  const createBooking = async () => {
    const response = await fetch('/api/v1/booking/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flightOffer,
        travelers,
        contactEmail: 'customer@example.com',
        contactPhone: '1234567890',
        contactPhoneCountryCode: '1',
        address: {...},
        seatSelections: selectedSeats,
        instantTicketing: true
      })
    });

    const result = await response.json();
    console.log('Booking created:', result.data);
  };

  const getSeatClass = (seat) => {
    const codes = seat.characteristicsCodes;
    if (codes.includes('W')) return 'window';
    if (codes.includes('A')) return 'aisle';
    if (codes.includes('E')) return 'exit-row';
    return 'middle';
  };

  return (
    <div>
      {seatMaps.map(seatMap => renderSeatMap(seatMap))}
      <button onClick={createBooking}>Book Flight</button>
    </div>
  );
}
```

### CSS Example

```css
.seat-map {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 8px;
  margin-top: 20px;
}

.seat {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  position: relative;
}

.seat.window {
  border-color: #3b82f6;
  background: #eff6ff;
}

.seat.aisle {
  border-color: #10b981;
  background: #ecfdf5;
}

.seat.exit-row {
  border-color: #f59e0b;
  background: #fef3c7;
}

.seat:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.5;
}

.seat .price {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  color: #ef4444;
  font-weight: bold;
}

.seat:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

---

## 📊 Aircraft Layout Example

### Boeing 787-9 (789) - Economy Class

```
Row    A   B   C       D   E   F       G   H   J
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1    [W] [M] [A]     [A] [M] [W]     [A] [M] [W]  (Bulkhead)
 2    [W] [M] [A]     [A] [M] [W]     [A] [M] [W]
 3    [W] [M] [A]     [A] [X] [W]     [A] [M] [W]
...
12    [$] [X] [$]     [$] [X] [$]     [$] [$] [X]  (EXIT ROW)
13    [$] [M] [$]     [$] [M] [$]     [$] [$] [M]  (Extra Legroom)
...
30    [W] [M] [A]     [A] [M] [W]     [A] [M] [W]

Legend:
[W] Window - Free          [$] Premium - Paid
[M] Middle - Free          [X] Unavailable
[A] Aisle - Free
```

---

## ⚠️ Important Notes

### Airline Support

❌ **Not all airlines provide seat maps via GDS**

- Budget carriers often don't support it
- Some airlines only allow seat selection on their website
- Full-service carriers usually support it

### Seat Availability

⚠️ **Real-time changes**

- Seats can be taken while user is selecting
- Always check availability before booking
- Booking may fail if seat becomes unavailable

### Multi-Segment Flights

✅ **Per-segment selection**

- Each flight leg has its own seat map
- Must select seats for each segment separately
- Segment IDs are in the flight offer

### Pricing

💰 **Variable pricing**

- Seat prices vary by airline and route
- Exit rows typically cost more
- Extra legroom seats are premium
- Standard seats usually free

---

## 🚨 Error Handling

### Common Errors

**404 - Seat Map Not Available**

```json
{
  "success": false,
  "message": "Seat map not available for this flight.",
  "statusCode": 404
}
```

**Solution:** Airline doesn't provide seat maps via API. Allow booking without seat selection.

**400 - Invalid Seat Selection**

```json
{
  "success": false,
  "message": "Seat number must be in format like 12A, 15F",
  "statusCode": 400
}
```

**Solution:** Validate seat number format before submitting.

**409 - Seat Already Taken**

```json
{
  "success": false,
  "message": "Selected seat is no longer available.",
  "statusCode": 409
}
```

**Solution:** Refresh seat map and ask user to select another seat.

---

## 📝 Testing Guide

### 1. Test SeatMap API

```bash
# Get pricing confirmation first
curl -X POST http://localhost:5000/api/v1/price-list/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffers": [...]
  }'

# Use the flight offer to get seat maps
curl -X POST http://localhost:5000/api/v1/seatmap \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffers": [/* paste flight offer */]
  }'
```

### 2. Test Booking with Seats

```bash
curl -X POST http://localhost:5000/api/v1/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffer": {...},
    "travelers": [...],
    "contactEmail": "test@example.com",
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
  }'
```

---

## 📚 Documentation Files

- **`/src/app/modules/seatmap/README.md`** - SeatMap API documentation
- **`/src/app/modules/booking/README.md`** - Booking API (updated with seat selection)
- **`/SEATMAP_API_GUIDE.md`** - This comprehensive guide

---

## ✅ Summary

### What We Built

✅ **SeatMap API** (`/api/v1/seatmap`)

- Get detailed seat maps for flights
- View seat availability, features, and pricing
- Per-segment seat maps

✅ **Enhanced Booking API** (`/api/v1/booking/create`)

- Accept optional seat selections
- Validate seat format and availability
- Pass seats to Amadeus booking API

✅ **Complete Implementation**

- TypeScript interfaces
- Zod validation
- Error handling
- Comprehensive documentation

### Key Features

💺 **Seat Information**

- Real-time availability
- Position (window/aisle/middle)
- Features (exit row/legroom)
- Pricing (free/premium)

🎯 **Integration**

- Works with existing price list API
- Seamless booking flow
- Optional seat selection

📱 **Developer Friendly**

- Clear API endpoints
- Detailed responses
- Example code
- Error handling

---

**Ready to use!** 🚀

Start testing the SeatMap API at: `POST /api/v1/seatmap`
