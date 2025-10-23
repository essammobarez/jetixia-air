# ✈️ Flight Booking ID Format

## 📋 Format

Flight booking IDs follow this structure:

```
WH-{wholesalerSlug}-AG-{agencySlug}-TKT-{sequenceNumber}
```

### **Example:**
```
WH-GWT-AG-TES-TKT-00001
```

---

## 🔍 Breakdown

| Component | Description | Example |
|-----------|-------------|---------|
| `WH-` | Wholesaler prefix | `WH-` |
| `{wholesalerSlug}` | Wholesaler slug (cleaned) | `GWT` |
| `AG-` | Agency prefix | `AG-` |
| `{agencySlug}` | Agency slug (cleaned) | `TES` |
| `TKT-` | Ticket/Flight identifier | `TKT-` |
| `{sequenceNumber}` | 5-digit sequence (auto-increment) | `00001` |

---

## 📊 Examples

```
WH-GWT-AG-TES-TKT-00001    ← First flight booking
WH-GWT-AG-TES-TKT-00002    ← Second flight booking
WH-GWT-AG-TES-TKT-00003    ← Third flight booking

WH-ABC-AG-XYZ-TKT-00001    ← Different agency/wholesaler
```

---

## 🔄 Comparison with Hotel Bookings

| Type | Format | Example |
|------|--------|---------|
| **Hotel** | `WH-{WS}-AG-{AG}-{SEQ}` | `WH-GWT-AG-TES-00123` |
| **Flight** | `WH-{WS}-AG-{AG}-TKT-{SEQ}` | `WH-GWT-AG-TES-TKT-00001` |

**Key Difference:** Flight bookings have the `TKT-` identifier to distinguish them from hotel bookings.

---

## 🛠️ How It Works

### **1. Slug Cleaning**

The system automatically cleans prefixes from agency and wholesaler slugs:

```typescript
// Input slugs
wholesalerSlug: "WH-GWT"  or  "GWT"
agencySlug: "AG-TES"      or  "TES"

// Cleaned (removes existing prefixes)
cleanWholesalerSlug: "GWT"
cleanAgencySlug: "TES"

// Final prefix
prefix: "WH-GWT-AG-TES-TKT"
```

### **2. Sequence Number**

- Auto-increments per agency/wholesaler combination
- Starts at `00001`
- Format: 5 digits with leading zeros

```typescript
// First booking
sequenceNumber: 1 → "00001"

// Second booking
sequenceNumber: 2 → "00002"

// 100th booking
sequenceNumber: 100 → "00100"

// 1000th booking
sequenceNumber: 1000 → "01000"
```

---

## 💻 Implementation

### **Function:**
```typescript
// src/app/modules/booking/flightBooking.utils.ts

generateFlightBookingSlug(agencySlug: string, agencyId: string)
```

### **Usage:**
```typescript
const { flightBookingId, sequenceNumber } = 
  await generateFlightBookingSlug("TES", "64f7a8b9c2d1e3f4a5b6c7d8");

// Returns:
{
  flightBookingId: "WH-GWT-AG-TES-TKT-00001",
  sequenceNumber: 1
}
```

---

## 📝 API Request

When creating a flight booking, you must provide:

```json
{
  "agency": "64f7a8b9c2d1e3f4a5b6c7d8",
  "agencySlug": "TES",
  "wholesaler": "64f7a8b9c2d1e3f4a5b6c7d9",
  "flightOffer": {...},
  "travelers": [...]
}
```

**Note:** The `agencySlug` field is required for ID generation.

---

## 🗄️ Database Storage

```javascript
{
  _id: ObjectId("..."),
  flightBookingId: "WH-GWT-AG-TES-TKT-00001",
  sequenceNumber: 1,
  pnr: "ABC123",
  agency: ObjectId("..."),
  wholesaler: ObjectId("..."),
  // ... other fields
}
```

---

## 🔍 Query Examples

### **Find by Booking ID**
```javascript
db.flightbookings.findOne({ 
  flightBookingId: "WH-GWT-AG-TES-TKT-00001" 
});
```

### **Find all bookings for an agency**
```javascript
db.flightbookings.find({ 
  flightBookingId: /^WH-GWT-AG-TES-TKT-/ 
});
```

### **Find latest booking**
```javascript
db.flightbookings.findOne({ 
  flightBookingId: /^WH-GWT-AG-TES-TKT-/ 
}).sort({ sequenceNumber: -1 });
```

---

## ✅ Benefits

1. **Unique IDs:** Each agency/wholesaler combination has separate sequences
2. **Easy Identification:** `TKT` clearly marks flight bookings
3. **Traceability:** Booking ID contains agency and wholesaler info
4. **Consistent Format:** Matches hotel booking structure
5. **Scalability:** Supports up to 99,999 bookings per agency/wholesaler

---

## 🎯 Summary

- ✅ Format: `WH-{WS}-AG-{AG}-TKT-{SEQ}`
- ✅ Auto-increments per agency/wholesaler
- ✅ Distinguishes flights from hotels with `TKT-`
- ✅ 5-digit sequence with leading zeros
- ✅ Stored in `flightbookings` collection

**Example:** `WH-GWT-AG-TES-TKT-00001`

