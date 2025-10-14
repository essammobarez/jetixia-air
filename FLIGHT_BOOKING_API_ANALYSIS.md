# 🎫 Amadeus Flight Booking API - Analysis & Implementation Guide

## 📚 API Reference

**Source:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-create-orders/api-reference

---

## 🎯 Overview

The **Flight Create Orders API** creates a flight booking (PNR - Passenger Name Record) with Amadeus.

**Endpoint:** `POST https://test.api.amadeus.com/v1/booking/flight-orders`

---

## 🔄 Complete Booking Flow

```
1. Search Flights
   POST /api/v1/price-list
   ↓
   User browses flight offers

2. Confirm Pricing
   POST /api/v1/price-list/confirm
   ↓
   Get confirmed price + details

3. Collect Passenger Info
   ↓
   User enters traveler details

4. Create Booking ⭐
   POST /v1/booking/flight-orders
   ↓
   Flight is booked!

5. Confirmation
   ↓
   Show PNR, booking reference
```

---

## 📝 Request Structure

### Required Data

The booking API requires:

#### 1. **Flight Offer** (from pricing confirmation)

```json
{
  "data": {
    "type": "flight-order",
    "flightOffers": [
      {
        /* Complete flight offer from pricing API */
      }
    ],
    "travelers": [
      {
        /* Passenger information */
      }
    ],
    "remarks": {
      /* Optional booking remarks */
    },
    "ticketingAgreement": {
      /* Ticketing preferences */
    },
    "contacts": [
      {
        /* Contact information */
      }
    ]
  }
}
```

---

## 👤 Traveler Information Structure

### Adult Traveler Example

```json
{
  "id": "1",
  "dateOfBirth": "1990-01-15",
  "name": {
    "firstName": "JOHN",
    "lastName": "DOE"
  },
  "gender": "MALE",
  "contact": {
    "emailAddress": "john.doe@example.com",
    "phones": [
      {
        "deviceType": "MOBILE",
        "countryCallingCode": "1",
        "number": "1234567890"
      }
    ]
  },
  "documents": [
    {
      "documentType": "PASSPORT",
      "birthPlace": "NEW YORK",
      "issuanceLocation": "NEW YORK",
      "issuanceDate": "2015-04-14",
      "number": "00000000",
      "expiryDate": "2025-04-14",
      "issuanceCountry": "US",
      "validityCountry": "US",
      "nationality": "US",
      "holder": true
    }
  ]
}
```

### Child Traveler Example

```json
{
  "id": "2",
  "dateOfBirth": "2015-06-20",
  "name": {
    "firstName": "JANE",
    "lastName": "DOE"
  },
  "gender": "FEMALE"
}
```

### Infant Traveler Example

```json
{
  "id": "3",
  "dateOfBirth": "2023-08-10",
  "name": {
    "firstName": "BABY",
    "lastName": "DOE"
  },
  "gender": "MALE",
  "associatedAdultId": "1"
}
```

---

## 📧 Contact Information

```json
{
  "contacts": [
    {
      "addresseeName": {
        "firstName": "JOHN",
        "lastName": "DOE"
      },
      "companyName": "ACME Travel",
      "purpose": "STANDARD",
      "phones": [
        {
          "deviceType": "MOBILE",
          "countryCallingCode": "1",
          "number": "1234567890"
        }
      ],
      "emailAddress": "john.doe@example.com",
      "address": {
        "lines": ["123 Main St"],
        "postalCode": "10001",
        "cityName": "New York",
        "countryCode": "US"
      }
    }
  ]
}
```

---

## 🎟️ Ticketing Agreement

```json
{
  "ticketingAgreement": {
    "option": "DELAY_TO_CANCEL",
    "delay": "6D"
  }
}
```

**Options:**

- `DELAY_TO_CANCEL` - Delay ticketing with automatic cancellation
- `DELAY_TO_QUEUE` - Delay ticketing with queue placement
- `CONFIRM` - Immediate ticketing

**Delay Format:**

- `6D` = 6 days
- `72H` = 72 hours
- `2M` = 2 months

---

## 📤 Response Structure

### Successful Booking

```json
{
  "data": {
    "type": "flight-order",
    "id": "eJzTd9f3NjIJdzUGAAp%2fAiY=",
    "queuingOfficeId": "NCE4D31SB",
    "associatedRecords": [
      {
        "reference": "ABCDEF",
        "creationDate": "2025-11-02T10:30:00",
        "originSystemCode": "GDS",
        "flightOfferId": "1"
      }
    ],
    "flightOffers": [
      /* Complete flight offer details */
    ],
    "travelers": [
      /* Complete traveler information */
    ],
    "contacts": [
      /* Contact information */
    ],
    "ticketingAgreement": {
      "option": "DELAY_TO_CANCEL",
      "delay": "6D",
      "dateTime": "2025-11-08T23:59:00"
    }
  }
}
```

**Key Response Fields:**

- `id` - Unique booking ID
- `associatedRecords[0].reference` - **PNR (Booking Reference)** ⭐
- `associatedRecords[0].creationDate` - Booking creation date
- `ticketingAgreement.dateTime` - Ticketing deadline

---

## ⚠️ Important Requirements

### 1. Passenger Names

- ✅ MUST be in **UPPERCASE**
- ✅ Must match travel documents exactly
- ✅ Special characters not allowed (use ASCII only)

### 2. Contact Information

- ✅ Email address is **mandatory**
- ✅ Phone number is **mandatory**
- ✅ Must be valid and reachable

### 3. Travel Documents (For International Flights)

- ✅ Passport required for international
- ✅ Must be valid for 6+ months
- ✅ Document number, expiry date required

### 4. Pricing Confirmation

- ✅ MUST confirm pricing before booking
- ✅ Flight offer must be recent (< 10 minutes old)
- ✅ Prices can change - handle errors

---

## 🏗️ Proposed API Structure

### File Structure

```
src/app/modules/booking/
├── booking.interface.ts      # Traveler, contact interfaces
├── booking.validation.ts     # Zod validation schemas
├── booking.service.ts        # Amadeus booking API integration
├── booking.controller.ts     # Request handler
├── booking.route.ts          # Route definition
└── README.md                 # Documentation
```

---

## 📋 Request Body Schema

### Your API Endpoint

**POST** `/api/v1/booking/flight-order`

### Request Body

```json
{
  "flightOffer": {
    /* Complete flight offer from confirm pricing API */
  },
  "travelers": [
    {
      "id": "1",
      "firstName": "JOHN",
      "lastName": "DOE",
      "dateOfBirth": "1990-01-15",
      "gender": "MALE",
      "email": "john.doe@example.com",
      "phoneCountryCode": "1",
      "phoneNumber": "1234567890",
      "documentType": "PASSPORT",
      "documentNumber": "00000000",
      "documentExpiryDate": "2025-04-14",
      "documentIssuanceCountry": "US",
      "nationality": "US"
    }
  ],
  "contactEmail": "john.doe@example.com",
  "contactPhone": "1234567890",
  "contactPhoneCountryCode": "1"
}
```

---

## 🔧 Implementation Steps

### Step 1: Create Interfaces

```typescript
// booking.interface.ts
export interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  documentType?: "PASSPORT" | "IDENTITY_CARD";
  documentNumber?: string;
  documentExpiryDate?: string;
  documentIssuanceCountry?: string;
  nationality?: string;
  associatedAdultId?: string; // For infants
}

export interface BookingRequest {
  flightOffer: any; // From pricing API
  travelers: Traveler[];
  contactEmail: string;
  contactPhone: string;
  contactPhoneCountryCode: string;
  remarks?: string;
}
```

### Step 2: Transform Data

```typescript
// booking.service.ts
function transformToAmadeusFormat(request: BookingRequest) {
  return {
    data: {
      type: "flight-order",
      flightOffers: [request.flightOffer],
      travelers: request.travelers.map((t) => ({
        id: t.id,
        dateOfBirth: t.dateOfBirth,
        name: {
          firstName: t.firstName.toUpperCase(),
          lastName: t.lastName.toUpperCase(),
        },
        gender: t.gender,
        contact: {
          emailAddress: t.email || request.contactEmail,
          phones: [
            {
              deviceType: "MOBILE",
              countryCallingCode:
                t.phoneCountryCode || request.contactPhoneCountryCode,
              number: t.phoneNumber || request.contactPhone,
            },
          ],
        },
        documents: t.documentNumber
          ? [
              {
                documentType: t.documentType,
                number: t.documentNumber,
                expiryDate: t.documentExpiryDate,
                issuanceCountry: t.documentIssuanceCountry,
                nationality: t.nationality,
                holder: true,
              },
            ]
          : undefined,
      })),
      contacts: [
        {
          addresseeName: {
            firstName: request.travelers[0].firstName.toUpperCase(),
            lastName: request.travelers[0].lastName.toUpperCase(),
          },
          purpose: "STANDARD",
          phones: [
            {
              deviceType: "MOBILE",
              countryCallingCode: request.contactPhoneCountryCode,
              number: request.contactPhone,
            },
          ],
          emailAddress: request.contactEmail,
        },
      ],
      ticketingAgreement: {
        option: "DELAY_TO_CANCEL",
        delay: "6D",
      },
    },
  };
}
```

### Step 3: Create Booking Service

```typescript
// booking.service.ts
export const createFlightBooking = async (request: BookingRequest) => {
  try {
    // Get OAuth token
    const token = await getAmadeusAccessToken();

    // Transform request to Amadeus format
    const amadeusRequest = transformToAmadeusFormat(request);

    // Call Amadeus Flight Create Orders API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/booking/flight-orders`;

    const response = await axios.post(url, amadeusRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Extract PNR and booking details
    const booking = response.data.data;
    const pnr = booking.associatedRecords[0].reference;

    return {
      bookingId: booking.id,
      pnr: pnr,
      status: "CONFIRMED",
      createdAt: booking.associatedRecords[0].creationDate,
      ticketingDeadline: booking.ticketingAgreement?.dateTime,
      flightOffers: booking.flightOffers,
      travelers: booking.travelers,
    };
  } catch (error) {
    // Handle errors (price changed, flight sold out, etc.)
    throw new AppError(httpStatus.BAD_REQUEST, "Booking failed");
  }
};
```

### Step 4: Validation

```typescript
// booking.validation.ts
const createBookingSchema = z.object({
  body: z.object({
    flightOffer: z.any(),
    travelers: z
      .array(
        z.object({
          id: z.string(),
          firstName: z.string().min(1).max(56),
          lastName: z.string().min(1).max(56),
          dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          gender: z.enum(["MALE", "FEMALE"]),
          email: z.string().email().optional(),
          phoneNumber: z.string().optional(),
          documentNumber: z.string().optional(),
        })
      )
      .min(1)
      .max(9),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
    contactPhoneCountryCode: z.string(),
  }),
});
```

---

## 🎯 API Endpoint Design

### Your Booking API

**POST** `/api/v1/booking/create`

### Request Flow

```
Client Request (Simplified)
    ↓
Validation
    ↓
Transform to Amadeus Format
    ↓
Call Amadeus Booking API
    ↓
Store in Database (Optional)
    ↓
Return Booking Confirmation
```

---

## 📊 Data Requirements

### Mandatory Fields

#### For All Travelers

- ✅ `firstName` (UPPERCASE)
- ✅ `lastName` (UPPERCASE)
- ✅ `dateOfBirth` (YYYY-MM-DD)
- ✅ `gender` (MALE/FEMALE)

#### For Lead Passenger

- ✅ `email` (valid email)
- ✅ `phone` (with country code)

#### For International Flights

- ✅ `passport.number`
- ✅ `passport.expiryDate`
- ✅ `passport.issuanceCountry`
- ✅ `nationality`

---

## 🔍 Example Request/Response

### Request to Your API

```json
{
  "flightOffer": {
    "id": "1",
    "type": "flight-offer",
    "source": "GDS",
    "itineraries": [...],
    "price": {...},
    "travelerPricings": [...]
  },
  "travelers": [
    {
      "id": "1",
      "firstName": "JOHN",
      "lastName": "DOE",
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
  "contactPhoneCountryCode": "61"
}
```

### Response from Your API

```json
{
  "success": true,
  "message": "Flight booked successfully!",
  "statusCode": 200,
  "data": {
    "bookingId": "eJzTd9f3NjIJdzUGAAp%2fAiY=",
    "pnr": "ABCDEF",
    "status": "CONFIRMED",
    "bookingReference": "ABCDEF",
    "createdAt": "2025-11-02T10:30:00",
    "ticketingDeadline": "2025-11-08T23:59:00",
    "totalPrice": "248.50",
    "currency": "USD",
    "passengers": [
      {
        "id": "1",
        "firstName": "JOHN",
        "lastName": "DOE",
        "type": "ADULT"
      }
    ],
    "flights": [
      {
        "from": "SYD",
        "to": "BKK",
        "date": "2025-11-02",
        "flightNumber": "MF 802"
      }
    ]
  }
}
```

---

## ⚠️ Common Errors & Handling

### 400 Bad Request

**Causes:**

- Invalid passenger data
- Missing required fields
- Invalid date formats
- Name format issues

**Solution:** Validate all data before sending

### 409 Conflict

**Causes:**

- Price changed since confirmation
- Flight sold out
- Seats no longer available

**Solution:** Re-confirm pricing, show error to user

### 422 Unprocessable Entity

**Causes:**

- Flight offer expired (> 10 minutes old)
- Invalid traveler pricing ID mismatch

**Solution:** Get fresh pricing confirmation

---

## 🎯 Implementation Checklist

### Backend Tasks

- [ ] Create `booking.interface.ts` with traveler/contact types
- [ ] Create `booking.validation.ts` with Zod schemas
- [ ] Create `booking.service.ts` with transform logic
- [ ] Implement `createFlightBooking()` function
- [ ] Add error handling for booking failures
- [ ] Create `booking.controller.ts` with request handler
- [ ] Create `booking.route.ts` and register
- [ ] Optional: Save bookings to database
- [ ] Optional: Send confirmation email

### Data Transformation

- [ ] Transform simplified traveler data to Amadeus format
- [ ] Convert names to UPPERCASE
- [ ] Build document structure
- [ ] Build contact structure
- [ ] Add ticketing agreement
- [ ] Handle infant associations

### Validation Rules

- [ ] Validate traveler count matches flight offer
- [ ] Validate dates (birth date, passport expiry)
- [ ] Validate phone numbers
- [ ] Validate email addresses
- [ ] Validate passport numbers (international flights)
- [ ] Ensure names are ASCII characters only

---

## 🛡️ Security Considerations

### PII Protection

- ⚠️ **Encrypt sensitive data** (passport numbers, DOB)
- ⚠️ **Hash personal information** in database
- ⚠️ **Use HTTPS only**
- ⚠️ **Comply with GDPR/privacy laws**

### Payment Security

- ⚠️ **Never store credit card details**
- ⚠️ Use payment gateway (Stripe, PayPal)
- ⚠️ PCI compliance if handling cards

### Data Retention

- ⚠️ Define retention policy
- ⚠️ Delete old booking data
- ⚠️ Anonymize after time period

---

## 📦 Database Schema (Optional)

### Booking Model

```typescript
interface BookingDocument {
  _id: ObjectId;
  bookingId: string; // Amadeus booking ID
  pnr: string; // Booking reference
  userId?: ObjectId; // Your user ID
  status: "PENDING" | "CONFIRMED" | "TICKETED" | "CANCELLED";

  flightOffer: any; // Complete flight offer
  travelers: any[]; // Traveler information

  totalPrice: number;
  currency: string;

  contactEmail: string;
  contactPhone: string;

  ticketingDeadline: Date;
  createdAt: Date;
  updatedAt: Date;

  // PII - encrypt these
  passportNumbers?: string[];
}
```

---

## 🎯 Recommended Implementation

### Phase 1: Basic Booking

```typescript
POST /api/v1/booking/create
- Accept flight offer + traveler data
- Transform to Amadeus format
- Call Amadeus API
- Return PNR and booking ID
```

### Phase 2: Database Storage

```typescript
- Save booking to MongoDB
- Associate with user account
- Send confirmation email
```

### Phase 3: Booking Management

```typescript
GET /api/v1/booking/:pnr - Retrieve booking
DELETE /api/v1/booking/:pnr - Cancel booking
GET /api/v1/booking/user/:userId - User's bookings
```

---

## 💡 Best Practices

### 1. Two-Step Confirmation

```javascript
// Step 1: Show booking preview
const preview = generateBookingPreview(flightOffer, travelers);
showToUser(preview);

// Step 2: User confirms
if (userConfirms) {
  const booking = await createBooking(flightOffer, travelers);
}
```

### 2. Handle Price Changes

```javascript
try {
  const booking = await createBooking(data);
  return booking;
} catch (error) {
  if (error.status === 409) {
    // Price changed - re-confirm pricing
    const newPricing = await confirmPricing(flightOffer);
    showPriceChangeDialog(newPricing);
  }
}
```

### 3. Validate Before Sending

```javascript
// Validate all required fields
const validation = validateTravelers(travelers);
if (!validation.valid) {
  throw new Error(validation.errors);
}

// Ensure flight offer is recent
if (isOlderThan10Minutes(flightOffer.timestamp)) {
  throw new Error("Please re-confirm pricing");
}
```

### 4. Send Confirmation Email

```javascript
// After successful booking
await sendBookingConfirmation({
  to: contactEmail,
  pnr: booking.pnr,
  travelers: travelers,
  flights: flightOffer.itineraries,
});
```

---

## 🔗 Related APIs

### Booking Management

After creating a booking, you can:

1. **Retrieve Booking**

   - `GET /v1/booking/flight-orders/{orderId}`
   - Get booking details by ID

2. **Delete Booking**

   - `DELETE /v1/booking/flight-orders/{orderId}`
   - Cancel the booking

3. **Flight Order Management**
   - Manage existing bookings
   - Update passenger information

---

## 📚 Additional Resources

- **API Reference:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-create-orders/api-reference
- **Developer Guide:** https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/booking
- **Test Data:** Use test credit cards and passport numbers in test environment

---

## ⚡ Quick Implementation Priority

### Must Have (MVP)

1. ✅ Accept flight offer + travelers
2. ✅ Transform to Amadeus format
3. ✅ Create booking via API
4. ✅ Return PNR

### Should Have

1. ✅ Save to database
2. ✅ Send confirmation email
3. ✅ Error handling
4. ✅ Validation

### Nice to Have

1. ✅ Booking retrieval
2. ✅ Booking cancellation
3. ✅ User booking history
4. ✅ Payment integration

---

## 🚀 Next Steps

1. **Create booking module structure**
2. **Implement data transformation**
3. **Add validation schemas**
4. **Create booking service**
5. **Test with Amadeus test environment**
6. **Add database storage (optional)**
7. **Integrate payment gateway**
8. **Send confirmation emails**

---

**Ready to implement? Let me know if you want me to build the booking API!** 🎫
