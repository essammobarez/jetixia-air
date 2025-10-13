# Flight Offers UI Design Guide

## 📱 Display Structure for Flight Offers

This guide explains how to display flight offer data from the Amadeus Price List API in a user-friendly interface.

---

## 🎯 Design Principles

1. **Progressive Disclosure** - Show essential info first, details on demand
2. **Visual Hierarchy** - Price and time are most important
3. **Scanability** - Users should quickly compare multiple flights
4. **Mobile-First** - Works well on small screens
5. **Clear CTAs** - Action buttons are prominent and clear

---

## 📊 Information Hierarchy

### Level 1: Flight Card (List View)

**Purpose:** Quick comparison of multiple flights

**Essential Information:**

- ✈️ Airline name + logo
- 💰 Total price (most prominent)
- 🕐 Departure & arrival times
- ⏱️ Total duration
- 🔄 Number of stops
- 🎒 Baggage summary
- 🪑 Cabin class

### Level 2: Expanded Details

**Purpose:** Full flight information before booking

**Detailed Information:**

- 🛫 Segment-by-segment breakdown
- ⏳ Layover durations
- 🛬 Terminal information
- ✈️ Aircraft type
- 💰 Price breakdown
- 🎒 Complete baggage & amenities
- 📋 Fare rules summary

---

## 🎨 UI Component Breakdown

### 1. Flight Card Component

```typescript
interface FlightCardProps {
  // From API response
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Itinerary[];
  carrierName: string; // ⭐ Enriched field
  carrierCode: string;
  numberOfStops: number;
  duration: string;
  cabinClass: string;
  baggageAllowance: string;
}
```

#### Visual Layout:

```
┌─────────────────────────────────────────────────────────┐
│ Header Row                                              │
│ ┌───────────────────────────────┬───────────────────┐  │
│ │ 🛫 AIRLINE NAME (CODE)        │  💰 $XXX.XX      │  │
│ └───────────────────────────────┴───────────────────┘  │
│                                                         │
│ Flight Timeline                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ORIGIN HH:MM ──●──●──→ DEST HH:MM (+days)      │   │
│ │              Xh XXm   N stops                    │   │
│ │                      STOP1, STOP2                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Additional Info                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎒 Baggage  │  🪑 Class  │  ⚠️ Conditions       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Actions                                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [View Details]              [Select Flight →]   │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key Display Rules:**

- Price in large, bold font (right-aligned)
- Airline name from `carrierName` (enriched field!)
- Show "+1 day" if arrival is next day
- Color-code by number of stops:
  - 🟢 Direct (0 stops)
  - 🟡 1 stop
  - 🔴 2+ stops

---

### 2. Flight Timeline Component

**Visual Representation:**

```
SYD 12:30 ──────●──────→ BKK 11:15 (+1)
        26h 45m    1 stop
                   XMN
```

**Data Mapping:**

```javascript
{
  origin: {
    code: itineraries[0].segments[0].departure.iataCode,
    time: formatTime(itineraries[0].segments[0].departure.at)
  },
  destination: {
    code: itineraries[0].segments[last].arrival.iataCode,
    time: formatTime(itineraries[0].segments[last].arrival.at)
  },
  duration: formatDuration(itineraries[0].duration), // "PT26H45M" → "26h 45m"
  stops: itineraries[0].segments.length - 1,
  layoverCities: itineraries[0].segments.slice(1).map(s => s.departure.iataCode)
}
```

---

### 3. Segment Details Component

**For Each Flight Segment:**

```
┌────────────────────────────────────────────────────┐
│ Segment 1: SYD → XMN                               │
├────────────────────────────────────────────────────┤
│                                                    │
│ 🛫 XIAMEN AIRLINES (MF 802)                       │
│    Boeing 787-9                                    │
│                                                    │
│ Departure: Nov 2, 2025 at 12:30 PM               │
│ Sydney (SYD) - Terminal 1                         │
│                                                    │
│ Arrival: Nov 2, 2025 at 6:55 PM                   │
│ Xiamen (XMN) - Terminal 3                         │
│                                                    │
│ Duration: 9h 25m  •  Direct Flight                │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Data Mapping:**

```javascript
{
  airlineName: segment.carrierName,  // ⭐ Enriched!
  flightNumber: `${segment.carrierCode} ${segment.number}`,
  aircraft: getAircraftName(segment.aircraft.code), // "789" → "Boeing 787-9"
  departure: {
    airport: segment.departure.iataCode,
    terminal: segment.departure.terminal,
    dateTime: formatDateTime(segment.departure.at)
  },
  arrival: {
    airport: segment.arrival.iataCode,
    terminal: segment.arrival.terminal,
    dateTime: formatDateTime(segment.arrival.at)
  },
  duration: formatDuration(segment.duration),
  stops: segment.numberOfStops
}
```

---

### 4. Layover Indicator

**Between Segments:**

```
┌────────────────────────────────────────────────────┐
│ ⏳ Layover in Xiamen (XMN)                        │
│    Duration: 13h 50m                               │
│    Terminal: 3                                     │
└────────────────────────────────────────────────────┘
```

**Calculation:**

```javascript
const layoverDuration = nextSegment.departure.at - currentSegment.arrival.at;
```

**Color Coding:**

- 🟢 Short (< 2 hours): May be tight
- 🟡 Medium (2-6 hours): Comfortable
- 🟠 Long (6-12 hours): Long wait
- 🔴 Very Long (> 12 hours): Overnight

---

### 5. Price Breakdown Component

```
┌────────────────────────────────────────────────────┐
│ 💰 Price Breakdown                                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ Base Fare                         $78.00          │
│ Taxes & Fees                      $0.00           │
│ Baggage Fees                      $196.50         │
│ ────────────────────────────────────────          │
│ Total                             $248.50         │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Data Mapping:**

```javascript
{
  baseFare: price.base,
  taxes: price.fees.reduce((sum, fee) => sum + fee.amount, 0),
  additionalServices: price.additionalServices
    .reduce((sum, service) => sum + service.amount, 0),
  total: price.total,
  grandTotal: price.grandTotal,
  currency: price.currency
}
```

---

### 6. Baggage & Amenities Component

```
┌────────────────────────────────────────────────────┐
│ 🎒 Baggage & Amenities                            │
├────────────────────────────────────────────────────┤
│                                                    │
│ ✅ 1 Checked Bag (23kg, 158cm)     Included       │
│ ✅ 1 Cabin Bag                     Included       │
│ ⚠️  Seat Selection                 Chargeable     │
│ ⚠️  Ticket Changes                 Chargeable     │
│ ⚠️  Refund                         Chargeable     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Data Extraction:**

```javascript
// From travelerPricings[0].fareDetailsBySegment[0]
const amenities = fareDetails.amenities.map((amenity) => ({
  description: amenity.description,
  included: !amenity.isChargeable,
  type: amenity.amenityType,
  icon: getIconForAmenityType(amenity.amenityType),
}));

// Baggage
const checkedBags = {
  quantity: fareDetails.includedCheckedBags.quantity,
  weight: extractWeightFromDescription(amenity.description), // "23kg"
  dimensions: extractDimensionsFromDescription(amenity.description), // "158cm"
};

const cabinBags = {
  quantity: fareDetails.includedCabinBags.quantity,
};
```

---

## 🎨 Visual Design Recommendations

### Color Scheme

```css
/* Primary Colors */
--primary-blue: #0066cc; /* Airline/flight related */
--primary-green: #00aa4f; /* Success, included items */
--primary-orange: #ff6b00; /* Warnings, chargeable items */

/* Status Colors */
--direct-flight: #00aa4f; /* Green for direct */
--one-stop: #ffa500; /* Orange for 1 stop */
--multi-stop: #dc143c; /* Red for 2+ stops */

/* Text Colors */
--text-primary: #1a1a1a; /* Main text */
--text-secondary: #666666; /* Secondary info */
--text-muted: #999999; /* Less important */

/* Background */
--bg-card: #ffffff; /* Card background */
--bg-hover: #f5f5f5; /* Hover state */
--bg-selected: #e3f2fd; /* Selected flight */
```

### Typography

```css
/* Hierarchy */
.price-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-blue);
}

.airline-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.time-display {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums; /* Align numbers */
}

.duration {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-text {
  font-size: 14px;
  color: var(--text-primary);
}

.muted-text {
  font-size: 12px;
  color: var(--text-muted);
}
```

---

## 📱 Responsive Design

### Mobile Layout (< 768px)

```
┌─────────────────────────┐
│ 🛫 AIRLINE NAME         │
│                         │
│ SYD 12:30 → BKK 11:15  │
│ 26h 45m • 1 stop        │
│                         │
│ 💰 $248.50             │
│                         │
│ Economy • 1 Bag         │
│                         │
│ [View Details]          │
│ [Select ───────→]       │
└─────────────────────────┘
```

- Stack information vertically
- Larger touch targets (min 44px)
- Simplified timeline
- Price below route (not to the right)

### Tablet (768px - 1024px)

- Show 2 cards per row
- Slightly condensed information
- Medium-sized fonts

### Desktop (> 1024px)

- Show 3-4 cards per row in grid
- Full details visible
- Hover effects for interactivity

---

## 🔧 Helper Functions

### Format Duration

```javascript
function formatDuration(isoDuration) {
  // "PT26H45M" → "26h 45m"
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}
```

### Format Time

```javascript
function formatTime(isoDateTime) {
  // "2025-11-02T12:30:00" → "12:30"
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
```

### Format Date

```javascript
function formatDate(isoDateTime) {
  // "2025-11-02T12:30:00" → "Nov 2, 2025"
  const date = new Date(isoDateTime);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
```

### Calculate Day Difference

```javascript
function getDayDifference(departureDateTime, arrivalDateTime) {
  const departure = new Date(departureDateTime);
  const arrival = new Date(arrivalDateTime);

  const daysDiff = Math.floor((arrival - departure) / (1000 * 60 * 60 * 24));

  return daysDiff > 0 ? `+${daysDiff}` : "";
}
```

### Get Aircraft Name

```javascript
const aircraftMap = {
  789: "Boeing 787-9",
  788: "Boeing 787-8",
  738: "Boeing 737-800",
  "73H": "Boeing 737-800",
  333: "Airbus A330-300",
  332: "Airbus A330-200",
  359: "Airbus A350-900",
  // ... more mappings
};

function getAircraftName(code) {
  return aircraftMap[code] || `Aircraft ${code}`;
}
```

---

## 🎯 Key UX Patterns

### 1. Sort Options

```
┌─────────────────────────────────────┐
│ Sort by:                            │
│ ○ Cheapest                          │
│ ● Fastest                           │
│ ○ Best Value                        │
│ ○ Departure Time                    │
│ ○ Arrival Time                      │
└─────────────────────────────────────┘
```

### 2. Filters

```
┌─────────────────────────────────────┐
│ Filters                             │
├─────────────────────────────────────┤
│ ✅ Direct Flights Only              │
│ ☐ 1 Stop                            │
│ ☐ 2+ Stops                          │
│                                     │
│ Price Range: $0 - $1000            │
│ ═════════○══════                    │
│                                     │
│ Airlines:                           │
│ ☐ XIAMEN AIRLINES                   │
│ ☐ SINGAPORE AIRLINES                │
│ ☐ MALAYSIA AIRLINES                 │
│                                     │
│ Departure Time:                     │
│ ☐ Morning (6AM - 12PM)             │
│ ☐ Afternoon (12PM - 6PM)           │
│ ☐ Evening (6PM - 12AM)             │
│ ☐ Night (12AM - 6AM)               │
└─────────────────────────────────────┘
```

### 3. Comparison View

Allow users to compare 2-3 flights side-by-side:

```
┌─────────────┬─────────────┬─────────────┐
│  Flight 1   │  Flight 2   │  Flight 3   │
├─────────────┼─────────────┼─────────────┤
│ $248.50     │ $320.00     │ $185.00     │
│ 26h 45m     │ 18h 30m     │ 32h 15m     │
│ 1 stop      │ 1 stop      │ 2 stops     │
│ Economy     │ Economy     │ Economy     │
│ 1 bag       │ 2 bags      │ No bags     │
└─────────────┴─────────────┴─────────────┘
```

---

## 📊 Data Processing Example

### React Component Structure

```typescript
// FlightCard.tsx
interface FlightCardProps {
  offer: FlightOffer; // From API
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const FlightCard = ({ offer, onSelect, onViewDetails }) => {
  const { id, price, itineraries, validatingAirlineCodes } = offer;

  // Extract main airline name (enriched!)
  const mainAirline = itineraries[0].segments[0].carrierName;

  // Get route info
  const firstSegment = itineraries[0].segments[0];
  const lastSegment =
    itineraries[0].segments[itineraries[0].segments.length - 1];

  const route = {
    origin: firstSegment.departure.iataCode,
    destination: lastSegment.arrival.iataCode,
    departureTime: formatTime(firstSegment.departure.at),
    arrivalTime: formatTime(lastSegment.arrival.at),
    departureDate: formatDate(firstSegment.departure.at),
    arrivalDate: formatDate(lastSegment.arrival.at),
  };

  // Calculate stops
  const numberOfStops = itineraries[0].segments.length - 1;
  const stopCities = itineraries[0].segments
    .slice(1)
    .map((s) => s.departure.iataCode)
    .join(", ");

  // Duration
  const duration = formatDuration(itineraries[0].duration);

  // Baggage
  const baggage =
    offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags
      .quantity;

  return <div className="flight-card">{/* Render UI */}</div>;
};
```

---

## ✅ Checklist for Implementation

### Essential Features

- [ ] Display airline name (use enriched `carrierName`)
- [ ] Show departure and arrival times
- [ ] Display total price prominently
- [ ] Show number of stops
- [ ] Display flight duration
- [ ] Show baggage allowance
- [ ] Indicate cabin class

### Enhanced Features

- [ ] Day difference indicator (+1, +2)
- [ ] Layover duration display
- [ ] Aircraft type information
- [ ] Terminal information
- [ ] Price breakdown
- [ ] Amenities list with icons
- [ ] Fare rules summary

### UX Features

- [ ] Sort options (price, duration, stops)
- [ ] Filter by stops, airline, time
- [ ] Comparison mode
- [ ] Mobile-responsive design
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling

### Accessibility

- [ ] ARIA labels for screen readers
- [ ] Keyboard navigation support
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators
- [ ] Alt text for icons

---

## 🎨 Design System Resources

### Icons to Use

- 🛫 Departure
- 🛬 Arrival
- ⏱️ Duration
- 🔄 Stops/Layover
- 💰 Price
- 🎒 Baggage
- 🪑 Seat/Cabin
- ✈️ Aircraft
- ⚠️ Warning/Chargeable
- ✅ Included/Success
- 📋 Details
- ❌ Not included

### Component Libraries

Consider using:

- **Material-UI** - Comprehensive components
- **Ant Design** - Good for data display
- **Chakra UI** - Accessible, customizable
- **Tailwind CSS** - Utility-first styling

---

## 🚀 Performance Tips

1. **Virtualization** - Use `react-window` for long flight lists
2. **Lazy Loading** - Load details on demand
3. **Memoization** - Cache formatted data
4. **Debouncing** - For search/filter inputs
5. **Pagination** - Show 10-20 flights at a time
6. **Image Optimization** - Use airline logo CDN

---

## 📝 Example: Full Flight Card HTML/CSS

```html
<div class="flight-card">
  <!-- Header -->
  <div class="flight-card-header">
    <div class="airline-info">
      <img src="airline-logo.png" alt="Xiamen Airlines" class="airline-logo" />
      <span class="airline-name">XIAMEN AIRLINES</span>
      <span class="airline-code">(MF)</span>
    </div>
    <div class="price">
      <span class="currency">$</span>
      <span class="amount">248.50</span>
    </div>
  </div>

  <!-- Timeline -->
  <div class="flight-timeline">
    <div class="departure">
      <div class="time">12:30</div>
      <div class="airport">SYD</div>
    </div>

    <div class="journey">
      <div class="route-line">
        <div class="stop-indicator"></div>
      </div>
      <div class="duration">26h 45m</div>
      <div class="stops">1 stop</div>
      <div class="stop-cities">XMN</div>
    </div>

    <div class="arrival">
      <div class="time">11:15 <span class="day-diff">+1</span></div>
      <div class="airport">BKK</div>
    </div>
  </div>

  <!-- Details -->
  <div class="flight-details">
    <div class="detail-item">
      <span class="icon">🎒</span>
      <span class="text">1 Checked Bag (23kg)</span>
    </div>
    <div class="detail-item">
      <span class="icon">🪑</span>
      <span class="text">Economy Standard</span>
    </div>
  </div>

  <!-- Actions -->
  <div class="flight-actions">
    <button class="btn-secondary" onclick="viewDetails('2')">
      View Details
    </button>
    <button class="btn-primary" onclick="selectFlight('2')">
      Select Flight →
    </button>
  </div>
</div>
```

---

**Note:** The key advantage of our API is that `carrierName` is already enriched with business names like "XIAMEN AIRLINES" instead of just "MF", making the UI immediately more user-friendly!
