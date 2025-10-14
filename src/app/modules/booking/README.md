# ✈️ Flight Booking API

Create flight bookings via Amadeus Flight Create Orders API.

---

## 📍 Endpoint

**POST** `/api/v1/booking/create`

---

## 🎯 Purpose

Create a flight booking (PNR) with Amadeus. Returns booking reference that can be used to issue tickets.

---

## 📝 Request Body

```json
{
  "flightOffer": {
    /* Complete flight offer from /api/v1/price-list/confirm */
  },
  "travelers": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "MALE",
      "email": "john.doe@example.com",
      "phoneCountryCode": "61",
      "phoneNumber": "412345678",
      "documentType": "PASSPORT",
      "documentNumber": "N12345678",
      "documentExpiryDate": "2028-12-31",
      "documentIssuanceCountry": "AU",
      "nationality": "AU"
    }
  ],
  "contactEmail": "john.doe@example.com",
  "contactPhone": "412345678",
  "contactPhoneCountryCode": "61",
  "address": {
    "lines": ["123 Main Street"],
    "postalCode": "2000",
    "cityName": "Sydney",
    "countryCode": "AU"
  },
  "remarks": "Optional booking remarks",
  "instantTicketing": true,
  "seatSelections": [
    {
      "segmentId": "25",
      "travelerIds": ["1"],
      "number": "12A"
    }
  ]
}
```

---

## 📋 Request Parameters

### Flight Offer

| Field       | Type   | Required | Description                                         |
| ----------- | ------ | -------- | --------------------------------------------------- |
| flightOffer | object | ✅ Yes   | Complete flight offer from pricing confirmation API |

**Source:** Get from `/api/v1/price-list/confirm` response

---

### Travelers (Array - 1 to 9 passengers)

| Field                   | Type   | Required  | Description                           | Example            |
| ----------------------- | ------ | --------- | ------------------------------------- | ------------------ |
| id                      | string | ✅ Yes    | Traveler ID (must match flight offer) | "1"                |
| firstName               | string | ✅ Yes    | First name (1-56 chars)               | "John"             |
| lastName                | string | ✅ Yes    | Last name (1-56 chars)                | "Doe"              |
| dateOfBirth             | string | ✅ Yes    | Date of birth (YYYY-MM-DD)            | "1990-01-15"       |
| gender                  | string | ✅ Yes    | Gender (MALE/FEMALE)                  | "MALE"             |
| email                   | string | ❌ No     | Email address                         | "john@example.com" |
| phoneCountryCode        | string | ❌ No     | Phone country code                    | "61"               |
| phoneNumber             | string | ❌ No     | Phone number                          | "412345678"        |
| documentType            | string | ❌ No\*   | PASSPORT or IDENTITY_CARD             | "PASSPORT"         |
| documentNumber          | string | ❌ No\*   | Passport/ID number                    | "N12345678"        |
| documentExpiryDate      | string | ❌ No\*   | Document expiry (YYYY-MM-DD)          | "2028-12-31"       |
| documentIssuanceCountry | string | ❌ No\*   | Issuing country code                  | "AU"               |
| nationality             | string | ❌ No\*   | Nationality country code              | "AU"               |
| associatedAdultId       | string | ❌ No\*\* | For infants only                      | "1"                |

\* **Required for international flights**  
\*\* **Required for infants only**

---

### Contact Information

| Field                   | Type   | Required | Description           | Example            |
| ----------------------- | ------ | -------- | --------------------- | ------------------ |
| contactEmail            | string | ✅ Yes   | Contact email address | "john@example.com" |
| contactPhone            | string | ✅ Yes   | Contact phone number  | "412345678"        |
| contactPhoneCountryCode | string | ✅ Yes   | Phone country code    | "61"               |

---

### Contact Address (Required)

| Field       | Type     | Required | Description                | Example         |
| ----------- | -------- | -------- | -------------------------- | --------------- |
| lines       | string[] | ✅ Yes   | Address lines (array)      | ["123 Main St"] |
| postalCode  | string   | ✅ Yes   | Postal/ZIP code            | "2000"          |
| cityName    | string   | ✅ Yes   | City name                  | "Sydney"        |
| countryCode | string   | ✅ Yes   | Country code (2 chars ISO) | "AU"            |

---

### Optional Fields

| Field            | Type    | Required | Description                                       | Default |
| ---------------- | ------- | -------- | ------------------------------------------------- | ------- |
| remarks          | string  | ❌ No    | Booking remarks or notes                          | -       |
| instantTicketing | boolean | ❌ No    | true = immediate ticket, false = delayed (6 days) | false   |

---

### 💺 Seat Selections (Optional)

Allows you to pre-select specific seats for travelers on each flight segment.

**Get seat availability first:** Use `/api/v1/seatmap` endpoint to see available seats before booking.

| Field       | Type     | Required | Description                         | Example |
| ----------- | -------- | -------- | ----------------------------------- | ------- |
| segmentId   | string   | ✅ Yes   | Flight segment ID from flight offer | "25"    |
| travelerIds | string[] | ✅ Yes   | Array of traveler IDs               | ["1"]   |
| number      | string   | ✅ Yes   | Seat number (format: 12A, 15F)      | "12A"   |

**Example:**

```json
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
]
```

**Notes:**

- Get segment IDs from the flight offer itineraries
- Each traveler needs one seat per segment
- Use `/api/v1/seatmap` to check seat availability and pricing
- Not all airlines support pre-seat selection
- Premium seats may have additional charges

---

## 📤 Response

```json
{
  "success": true,
  "message": "Flight booking created successfully!",
  "statusCode": 201,
  "data": {
    "bookingId": "eJzTd9f3NjIJdzUGAAp%2fAiY=",
    "pnr": "ABCDEF",
    "status": "RESERVED",
    "createdAt": "2025-11-02T10:30:00",
    "ticketingDeadline": "2025-11-08T23:59:00",
    "ticketingOption": "DELAY_TO_CANCEL",
    "eTicketNumber": null,
    "queuingOfficeId": "NCE4D31SB",
    "ticketingAgreement": {
      "option": "DELAY_TO_CANCEL",
      "delay": "6D",
      "dateTime": "2025-11-08T23:59:00"
    },
    "flightOffers": [
      /* Complete flight offer details */
    ],
    "travelers": [
      /* Complete traveler information */
    ],
    "contacts": [
      /* Contact information */
    ],
    "seatSelections": [
      {
        "segmentId": "25",
        "travelerIds": ["1"],
        "number": "12A"
      }
    ]
  }
}
```

### Response Fields

| Field              | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| bookingId          | Amadeus booking ID (use for ticketing/cancellation)        |
| pnr                | **Booking Reference** (6-character code like "ABCDEF")     |
| status             | **TICKETED** (instant) or **RESERVED** (delayed)           |
| createdAt          | Booking creation timestamp                                 |
| ticketingDeadline  | Deadline to issue ticket (only for delayed)                |
| ticketingOption    | **"CONFIRM"** (instant) or **"DELAY_TO_CANCEL"** (delayed) |
| eTicketNumber      | 13-digit e-ticket number (only if instant ticketing)       |
| queuingOfficeId    | Amadeus office ID                                          |
| ticketingAgreement | Complete ticketing agreement object from Amadeus           |
| automatedProcess   | Automated process details (if instant: code="IMMEDIATE")   |
| seatSelections     | Seat selections from request (Amadeus doesn't return this) |

---

## ⚠️ Important: Seat Selection Behavior

### Amadeus API Limitation

**Amadeus does NOT return seat selections in the booking response**, even though the seats ARE confirmed and assigned.

**Our Solution:**

- We return the `seatSelections` you sent in the request
- The seats are still confirmed with Amadeus
- The PNR contains the seat assignments
- You can verify seats via the Flight Order Management API

**Why this works:**

- ✅ Seats are accepted by Amadeus
- ✅ Seats are assigned in the airline system
- ✅ You get immediate confirmation of what was requested
- ✅ No additional API calls needed

📖 **See [SEAT_SELECTION_GUIDE.md](../../../SEAT_SELECTION_GUIDE.md) for detailed information**

---

## 🔄 Complete Booking Flow

### Step-by-Step

```
1. Search Flights
   POST /api/v1/price-list
   {
     "originLocationCode": "SYD",
     "destinationLocationCode": "BKK",
     "departureDate": "2025-11-02",
     "adults": 1
   }

2. Select Flight & Confirm Pricing
   POST /api/v1/price-list/confirm
   {
     "flightOffers": [selectedFlight]
   }

3. Collect Passenger Information
   Frontend form collects:
   - Names, DOB, gender
   - Contact info
   - Passport (if international)

4. Create Booking ⭐
   POST /api/v1/booking/create
   {
     "flightOffer": confirmedFlight,
     "travelers": [passengerData],
     "contactEmail": "...",
     "contactPhone": "..."
   }

5. Success!
   Response includes:
   - PNR: ABCDEF
   - Ticketing deadline: Nov 8
```

---

## 💡 Example Usage

### Complete Example Request

```bash
curl -X POST http://localhost:5000/api/v1/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffer": {
      "type": "flight-offer",
      "id": "1",
      "source": "GDS",
      "itineraries": [...],
      "price": {...},
      "travelerPricings": [...]
    },
    "travelers": [
      {
        "id": "1",
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1990-01-15",
        "gender": "MALE",
        "email": "john.doe@example.com",
        "phoneCountryCode": "61",
        "phoneNumber": "412345678",
        "documentType": "PASSPORT",
        "documentNumber": "N12345678",
        "documentExpiryDate": "2028-12-31",
        "documentIssuanceCountry": "AU",
        "nationality": "AU"
      }
    ],
    "contactEmail": "john.doe@example.com",
    "contactPhone": "412345678",
    "contactPhoneCountryCode": "61",
    "address": {
      "lines": ["123 Main Street"],
      "postalCode": "2000",
      "cityName": "Sydney",
      "countryCode": "AU"
    }
  }'
```

---

## ⚠️ Important Notes

### Names Must Be Uppercase

Names are **automatically converted to UPPERCASE** by the API.

- Input: "John Doe"
- Sent to Amadeus: "JOHN DOE"

### Flight Offer Freshness

The flight offer should be from a recent pricing confirmation (< 10 minutes old).
If older, re-confirm pricing first.

### Ticketing Deadline

**Default:** 6 days from booking creation
After this deadline, Amadeus will **auto-cancel** the booking if not ticketed.

### Passenger Count

Number of travelers must match the flight offer's `travelerPricings` array.

### International Flights

Passport information is **required** for international flights:

- documentNumber
- documentExpiryDate
- nationality
- documentIssuanceCountry

---

## ❌ Error Handling

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid booking data. Please check passenger information and flight offer.",
  "statusCode": 400
}
```

**Causes:** Invalid passenger data, missing required fields, invalid formats

### 409 Conflict

```json
{
  "success": false,
  "message": "Flight price has changed or seats are no longer available. Please re-confirm pricing.",
  "statusCode": 409
}
```

**Causes:** Price changed, flight sold out, seats unavailable

### 422 Unprocessable Entity

```json
{
  "success": false,
  "message": "Flight offer has expired. Please get a fresh pricing confirmation.",
  "statusCode": 422
}
```

**Causes:** Flight offer too old (> 10 minutes), traveler ID mismatch

---

## 🎯 What Happens After Booking

### Booking Created (Status: RESERVED)

- ✅ PNR generated (e.g., "ABCDEF")
- ✅ Seats **reserved** on flight (not ticketed)
- ✅ Booking valid for 6 days
- ⏰ Must ticket before deadline
- ❌ No payment charged yet
- ❌ No ticket issued yet

### Status Flow

```
RESERVED → (payment + ticketing) → TICKETED → (customer travels) → COMPLETED
   ↓
   └─(deadline expires)─→ CANCELLED
```

### Next Steps

1. **Process payment** (via Stripe/PayPal/etc.)
2. **Issue ticket** (call Amadeus ticketing API: `POST /v1/booking/flight-orders/{id}/ticketing`)
3. **Status becomes TICKETED** (fully confirmed)
4. **Send confirmation** to customer

---

## 🔧 Technical Details

### Ticketing Options

#### Option 1: Delayed Ticketing (Default)

**Request:**

```json
{
  "instantTicketing": false
  // or omit this field (defaults to false)
}
```

**Result:**

```json
{
  "ticketingAgreement": {
    "option": "DELAY_TO_CANCEL",
    "delay": "6D"
  }
}
```

**What Happens:**

- ✅ Booking created, seats reserved
- ⏰ 6 days to issue ticket
- ❌ No payment charged yet
- 📋 Status: **RESERVED**
- ⚠️ If not ticketed → auto-cancelled

**Use When:**

- Collecting payment separately
- "Book now, pay later" flow
- Need time to process payment

---

#### Option 2: Instant Ticketing ⭐

**Request:**

```json
{
  "instantTicketing": true
}
```

**Result:**

```json
{
  "ticketingAgreement": {
    "option": "CONFIRM"
  }
}
```

**What Happens:**

- ✅ Booking created
- ✅ Ticket issued **immediately**
- ✅ E-ticket number generated
- 💳 Payment charged **right away**
- 📋 Status: **TICKETED**
- ✅ Fully confirmed

**Use When:**

- Customer pays immediately
- Standard online booking
- No payment delays needed

### Data Transformations

- Names converted to UPPERCASE
- Phone formatted to Amadeus structure
- Documents structured for Amadeus
- Contact information formatted

---

## 📚 Related APIs

### Before Booking

1. `POST /api/v1/price-list` - Search flights
2. `POST /api/v1/price-list/confirm` - Confirm pricing

### After Booking

1. `POST /v1/booking/flight-orders/{id}/ticketing` - Issue ticket (call Amadeus directly)
2. `GET /v1/booking/flight-orders/{id}` - Retrieve booking (call Amadeus directly)
3. `DELETE /v1/booking/flight-orders/{id}` - Cancel booking (call Amadeus directly)

---

## ✅ Quick Summary

| Feature       | Details                       |
| ------------- | ----------------------------- |
| **Endpoint**  | POST `/api/v1/booking/create` |
| **Input**     | Flight offer + Traveler data  |
| **Output**    | PNR + Booking ID              |
| **Ticketing** | Delayed (6 days)              |
| **Payment**   | NOT handled by this API       |
| **Database**  | NOT saved (pure API call)     |

---

**This API creates the booking only. You need to handle payment and ticketing separately.** 🎫
