# 🎫 Instant vs Delayed Ticketing

## 🎯 Two Ticketing Options

Your booking API now supports **both instant and delayed ticketing**!

---

## ⚡ Option 1: Instant Ticketing (CONFIRM)

### Request
```json
{
  "flightOffer": { /* ... */ },
  "travelers": [ /* ... */ ],
  "contactEmail": "john@example.com",
  "contactPhone": "412345678",
  "contactPhoneCountryCode": "61",
  "address": { /* ... */ },
  "instantTicketing": true  // ⭐ Set to true
}
```

### What Happens
```
Booking Created
    ↓ (immediately)
Ticket Issued
    ↓ (immediately)
Payment Charged
    ↓
Status: TICKETED ✅
```

### Response
```json
{
  "success": true,
  "data": {
    "pnr": "ABCDEF",
    "status": "TICKETED",           // ✅ Fully confirmed
    "ticketingDeadline": null,      // No deadline needed
    "createdAt": "2025-11-02T10:30:00"
  }
}
```

### When to Use
- ✅ Customer pays **immediately** (credit card, PayPal, etc.)
- ✅ Standard online booking
- ✅ No delays needed
- ✅ E-commerce model

### Benefits
- ✅ **Instant confirmation** - Customer gets ticket immediately
- ✅ **No deadline stress** - No risk of auto-cancellation
- ✅ **Simple flow** - One-step booking
- ✅ **Immediate e-ticket** - Customer can travel right away

### Drawbacks
- ⚠️ **Payment required** - Must charge immediately
- ⚠️ **No holds** - Can't "reserve now, pay later"
- ⚠️ **Harder refunds** - More complex to cancel

---

## ⏰ Option 2: Delayed Ticketing (DELAY_TO_CANCEL)

### Request
```json
{
  "flightOffer": { /* ... */ },
  "travelers": [ /* ... */ ],
  "contactEmail": "john@example.com",
  "contactPhone": "412345678",
  "contactPhoneCountryCode": "61",
  "address": { /* ... */ },
  "instantTicketing": false  // ⭐ Set to false or omit (default)
}
```

### What Happens
```
Booking Created
    ↓
Status: RESERVED
    ↓ (up to 6 days)
Customer Pays
    ↓
You Call Ticketing API
    ↓
Ticket Issued
    ↓
Status: TICKETED ✅
```

### Response
```json
{
  "success": true,
  "data": {
    "pnr": "ABCDEF",
    "status": "RESERVED",                    // ⏰ Not ticketed yet
    "ticketingDeadline": "2025-11-08T23:59:00",  // Must ticket by this date
    "createdAt": "2025-11-02T10:30:00"
  }
}
```

### When to Use
- ✅ "Book now, pay later" model
- ✅ Payment gateway processing time needed
- ✅ Corporate bookings requiring approval
- ✅ Hold seats while collecting payment

### Benefits
- ✅ **Flexible payment** - Customer can pay later
- ✅ **Hold seats** - Reserve without immediate payment
- ✅ **Payment retries** - Can handle failed payments
- ✅ **No immediate charge** - Collect payment when ready

### Drawbacks
- ⚠️ **Deadline management** - Must track ticketing deadline
- ⚠️ **Auto-cancellation** - Booking cancelled if not ticketed
- ⚠️ **Extra step** - Need to call ticketing API after payment

---

## 📊 Comparison

| Feature | Instant Ticketing | Delayed Ticketing |
|---------|------------------|-------------------|
| **Status After Booking** | TICKETED | RESERVED |
| **Payment** | Immediate | Later (within 6 days) |
| **E-Ticket** | Issued immediately | Issued after payment |
| **Deadline** | None | 6 days |
| **Auto-Cancel** | No | Yes (if not ticketed) |
| **Use Case** | Pay now | Pay later |
| **Complexity** | Simple | Moderate |
| **Customer Experience** | Instant confirmation | Hold & confirm later |

---

## 💡 Example Payloads

### Example 1: Instant Ticketing (Pay Immediately)

```json
{
  "flightOffer": { /* from /price-list/confirm */ },
  "travelers": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "MALE",
      "email": "john@example.com",
      "phoneCountryCode": "61",
      "phoneNumber": "412345678",
      "documentNumber": "N12345678",
      "documentExpiryDate": "2028-12-31",
      "documentIssuanceCountry": "AU",
      "nationality": "AU"
    }
  ],
  "contactEmail": "john@example.com",
  "contactPhone": "412345678",
  "contactPhoneCountryCode": "61",
  "address": {
    "lines": ["123 Main St"],
    "postalCode": "2000",
    "cityName": "Sydney",
    "countryCode": "AU"
  },
  "instantTicketing": true  // ⭐ Instant ticket
}
```

**Response:**
- Status: **TICKETED** ✅
- E-ticket issued immediately
- No ticketing deadline

---

### Example 2: Delayed Ticketing (Pay Later)

```json
{
  "flightOffer": { /* from /price-list/confirm */ },
  "travelers": [ /* ... */ ],
  "contactEmail": "john@example.com",
  "contactPhone": "412345678",
  "contactPhoneCountryCode": "61",
  "address": {
    "lines": ["123 Main St"],
    "postalCode": "2000",
    "cityName": "Sydney",
    "countryCode": "AU"
  },
  "instantTicketing": false  // ⭐ Delayed ticket (or omit)
}
```

**Response:**
- Status: **RESERVED** ⏰
- Not ticketed yet
- Ticketing deadline: Nov 8, 2025
- Must call ticketing API after payment

---

## 🔄 Workflow Comparison

### Instant Ticketing Flow
```
Customer → Fills Form → Pays → Booking API (instant=true)
                                     ↓
                                TICKETED ✅
                                     ↓
                            E-ticket Sent
                                     ↓
                                  Done!
```

### Delayed Ticketing Flow
```
Customer → Fills Form → Booking API (instant=false)
                             ↓
                         RESERVED
                             ↓
               "Pay by Nov 8" Email Sent
                             ↓
            Customer Pays (within 6 days)
                             ↓
              You Call Ticketing API
                             ↓
                         TICKETED ✅
                             ↓
                       E-ticket Sent
                             ↓
                           Done!
```

---

## 🎯 Recommendation

### For Standard E-Commerce
```json
{
  "instantTicketing": true
}
```
**Why:** Customer pays immediately, gets instant confirmation

### For "Book Now, Pay Later"
```json
{
  "instantTicketing": false
}
```
**Why:** Hold seats while collecting payment

---

## ✅ Summary

| Field | Value | Result |
|-------|-------|--------|
| `instantTicketing: true` | Immediate | Status: **TICKETED** ✅ |
| `instantTicketing: false` | Delayed (6 days) | Status: **RESERVED** ⏰ |
| (omit field) | Delayed (default) | Status: **RESERVED** ⏰ |

**You can now choose based on your business model!** 🚀

