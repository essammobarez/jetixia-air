# Booking Slug Support Documentation

## Overview

The unified booking system now supports **slug-based booking IDs** that include wholesaler and agency identifiers, making it easy to track which wholesaler and agency created each booking.

## Booking ID Formats

### **With Slugs** (Recommended)

```
WH-{wholesalerSlug}-AG-{agencySlug}-TKT-{sequenceNumber}
```

**Examples:**

- `WH-GWT-AG-TES-TKT-00001`
- `WH-SKYAIR-AG-TRAVEL-TKT-00042`
- `WH-ABC-AG-XYZ-TKT-00123`

### **Without Slugs** (Fallback)

```
TKT-{sequenceNumber}
```

**Examples:**

- `TKT-00000001`
- `TKT-00000042`
- `TKT-00000123`

## How It Works

### **1. Automatic Slug Detection**

The system automatically fetches slugs from the database when creating a booking:

```typescript
// If wholesalerId and agencyId are provided
const { wholesalerSlug, agencySlug } = await getAgencyWholesalerSlugs(
  request.wholesalerId,
  request.agencyId
);

// Generate ID with slugs (if available)
const { bookingId, ticketId, sequenceNumber } = await generateBookingSlug(
  wholesalerSlug,
  agencySlug
);
```

### **2. Slug Extraction**

Extract wholesaler and agency information from booking ID:

```typescript
import { parseBookingSlug } from "./booking.utils";

const bookingId = "WH-GWT-AG-TES-TKT-00001";
const { wholesalerSlug, agencySlug, sequenceNumber } =
  parseBookingSlug(bookingId);

// Result:
// wholesalerSlug: "GWT"
// agencySlug: "TES"
// sequenceNumber: "00001"
```

### **3. Sequential Numbering**

Each wholesaler-agency combination has its own sequence:

```
WH-GWT-AG-TES-TKT-00001  ← First booking by GWT/TES
WH-GWT-AG-TES-TKT-00002  ← Second booking by GWT/TES
WH-SKYAIR-AG-TRAVEL-TKT-00001  ← First booking by SKYAIR/TRAVEL (independent sequence)
```

## Benefits

✅ **Easy Identification**: Immediately know which wholesaler/agency created the booking
✅ **Independent Sequences**: Each wholesaler-agency pair has their own numbering
✅ **Backward Compatible**: Falls back to simple `TKT-XXXXXXXX` if slugs not available
✅ **URL Friendly**: No special characters, easy to use in URLs and APIs
✅ **Human Readable**: Easy to understand and communicate

## Database Requirements

### **Wholesaler Model**

```javascript
{
  _id: ObjectId("..."),
  slug: "GWT",  // Required for slug-based IDs
  name: "Global Travel Wholesalers"
}
```

### **Agency Model**

```javascript
{
  _id: ObjectId("..."),
  slug: "TES",  // Required for slug-based IDs
  name: "Travel Express Solutions"
}
```

## API Usage

### **Creating Booking with Slugs**

```json
POST /api/v1/booking/create

{
  "supplier": "ebooking",
  "wholesalerId": "507f191e810c19729de860ea",
  "agencyId": "507f1f77bcf86cd799439011",
  "travelers": [...],
  ...
}
```

**Response:**

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Flight booking created successfully via ebooking!",
  "data": {
    "bookingId": "WH-GWT-AG-TES-TKT-00001",
    "ticketId": "WH-GWT-AG-TES-TKT-00001",
    "sequenceNumber": 1,
    "pnr": "PNR-WH-GWT-AG-TES-TKT-00001",
    "status": "PENDING",
    "supplier": "ebooking",
    "agency": "507f1f77bcf86cd799439011",
    "wholesaler": "507f191e810c19729de860ea"
  }
}
```

### **Creating Booking without Slugs**

If wholesaler/agency don't have slugs or IDs not provided:

```json
POST /api/v1/booking/create

{
  "supplier": "ebooking",
  "travelers": [...],
  ...
}
```

**Response:**

```json
{
  "data": {
    "bookingId": "TKT-00000001",
    "ticketId": "TKT-00000001",
    ...
  }
}
```

## Implementation Details

### **Utility Functions**

#### `generateBookingSlug(wholesalerSlug?, agencySlug?)`

Generates a unique booking ID with optional slug support.

```typescript
// With slugs
const result = await generateBookingSlug("GWT", "TES");
// Returns: {
//   bookingId: "WH-GWT-AG-TES-TKT-00001",
//   ticketId: "WH-GWT-AG-TES-TKT-00001",
//   sequenceNumber: 1
// }

// Without slugs
const result = await generateBookingSlug();
// Returns: {
//   bookingId: "TKT-00000001",
//   ticketId: "TKT-00000001",
//   sequenceNumber: 1
// }
```

#### `parseBookingSlug(bookingId)`

Extracts information from booking ID.

```typescript
const info = parseBookingSlug("WH-GWT-AG-TES-TKT-00001");
// Returns: {
//   wholesalerSlug: "GWT",
//   agencySlug: "TES",
//   sequenceNumber: "00001"
// }
```

### **Database Schema**

The booking model stores both `bookingId` and `ticketId`:

```typescript
{
  bookingId: "WH-GWT-AG-TES-TKT-00001",  // Primary ID with slug
  ticketId: "WH-GWT-AG-TES-TKT-00001",   // Alias for backward compatibility
  sequenceNumber: 1,
  pnr: "PNR-WH-GWT-AG-TES-TKT-00001",
  supplier: "ebooking",
  agency: ObjectId("507f1f77bcf86cd799439011"),
  wholesaler: ObjectId("507f191e810c19729de860ea"),
  ...
}
```

## Migration from Simple IDs

If you have existing bookings with simple `TKT-XXXXXXXX` format:

1. ✅ **No migration needed** - both formats are supported
2. ✅ **New bookings** will use slug format if wholesaler/agency have slugs
3. ✅ **Old bookings** continue to work with simple format
4. ✅ **Queries work** for both formats

## Best Practices

1. **Always provide wholesalerId and agencyId** when creating bookings
2. **Ensure wholesaler and agency models have `slug` field** populated
3. **Use short, uppercase slugs** (e.g., "GWT", "TES") for cleaner IDs
4. **Slugs should be unique** per wholesaler/agency for clarity

## Example Slugs

| Entity     | Full Name                 | Slug     |
| ---------- | ------------------------- | -------- |
| Wholesaler | Global Travel Wholesalers | `GWT`    |
| Wholesaler | SkyAir International      | `SKYAIR` |
| Wholesaler | ABC Travel Corp           | `ABC`    |
| Agency     | Travel Express Solutions  | `TES`    |
| Agency     | Journey Makers Ltd        | `JML`    |
| Agency     | XYZ Travel Agency         | `XYZ`    |

## Comparison with flightBooking.model.ts

Both models now support slug-based IDs with the same pattern:

| Feature      | booking.model.ts        | flightBooking.model.ts        |
| ------------ | ----------------------- | ----------------------------- |
| Slug Support | ✅ Yes                  | ✅ Yes                        |
| Format       | `WH-X-AG-Y-TKT-NNNNN`   | `WH-X-AG-Y-TKT-NNNNN`         |
| Fallback     | `TKT-NNNNNNNN`          | Simple format                 |
| Utility      | `generateBookingSlug()` | `generateFlightBookingSlug()` |

**Unified experience across both booking models!** 🎉





