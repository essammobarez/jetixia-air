import mongoose, { model, Schema } from "mongoose";

// ==================== PASSENGER/TRAVELER SCHEMA ====================
const PassengerSchema = new Schema(
  {
    travelerId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String, required: true }, // YYYY-MM-DD
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    email: { type: String },
    phoneCountryCode: { type: String },
    phoneNumber: { type: String },
    documentType: { type: String, enum: ["PASSPORT", "IDENTITY_CARD"] },
    documentNumber: { type: String },
    documentExpiryDate: { type: String }, // YYYY-MM-DD
    documentIssuanceCountry: { type: String },
    documentIssuanceDate: { type: String },
    nationality: { type: String },
    birthPlace: { type: String },
    issuanceLocation: { type: String },
    associatedAdultId: { type: String }, // For infants
  },
  { _id: false }
);

// ==================== FLIGHT SEGMENT SCHEMA ====================
const FlightSegmentSchema = new Schema(
  {
    segmentId: { type: String },
    departure: {
      iataCode: { type: String, required: true },
      terminal: { type: String },
      at: { type: String, required: true }, // ISO DateTime
    },
    arrival: {
      iataCode: { type: String, required: true },
      terminal: { type: String },
      at: { type: String, required: true }, // ISO DateTime
    },
    carrierCode: { type: String, required: true },
    flightNumber: { type: String, required: true },
    aircraft: { type: String },
    operating: {
      carrierCode: { type: String },
    },
    duration: { type: String },
    numberOfStops: { type: Number, default: 0 },
    blacklistedInEU: { type: Boolean, default: false },
  },
  { _id: false }
);

// ==================== ITINERARY SCHEMA ====================
const ItinerarySchema = new Schema(
  {
    duration: { type: String },
    segments: [FlightSegmentSchema],
  },
  { _id: false }
);

// ==================== PRICING SCHEMA ====================
const FlightPriceDetailsSchema = new Schema(
  {
    price: {
      value: Number,
      currency: String,
    },
    originalPrice: {
      value: Number,
      currency: String,
    },
    baseFare: {
      value: Number,
      currency: String,
    },
    taxes: {
      value: Number,
      currency: String,
    },
    fees: {
      value: Number,
      currency: String,
    },
    markupApplied: {
      type: {
        type: String,
        default: "percentage",
      },
      value: Number,
      description: String,
    },
  },
  { _id: false }
);

// ==================== BAGGAGE SCHEMA ====================
const BaggageSchema = new Schema(
  {
    quantity: Number,
    weight: Number,
    weightUnit: String,
  },
  { _id: false }
);

// ==================== SEAT SELECTION SCHEMA ====================
const SeatSelectionSchema = new Schema(
  {
    segmentId: { type: String, required: true },
    travelerIds: [{ type: String }],
    number: { type: String, required: true }, // e.g., "12A"
  },
  { _id: false }
);

// ==================== CONTACT SCHEMA ====================
const ContactSchema = new Schema(
  {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    phoneCountryCode: { type: String, required: true },
    address: {
      lines: [{ type: String }],
      postalCode: { type: String },
      cityName: { type: String },
      countryCode: { type: String },
    },
  },
  { _id: false }
);

// ==================== PAYMENT SCHEMA ====================
const PaymentSchema = new Schema(
  {
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "" },
    paymentMethod: { type: String, required: true }, // "agent", "credit", etc.
    status: { type: String, required: true }, // "succeeded", "requires_capture", etc.
    captureMethod: { type: String }, // "automatic" or "manual"
    taxAmount: { type: Number },
    subtotal: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ==================== MAIN FLIGHT BOOKING SCHEMA ====================
const FlightBookingSchema = new Schema(
  {
    // ==================== IDENTIFIERS ====================
    flightBookingId: {
      type: String,
      required: true,
      unique: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },

    // ==================== AMADEUS REFERENCES ====================
    pnr: {
      type: String,
      required: true,
    },
    amadeusBookingId: {
      type: String,
      required: true,
    },

    // ==================== LINK TO MAIN BOOKING (OPTIONAL) ====================
    mainBooking: {
      type: Schema.Types.ObjectId,
      ref: "Bookingsv2",
      default: null,
    },
    mainBookingId: {
      type: String,
      default: null,
    },
    isStandalone: {
      type: Boolean,
      default: true,
    },

    // ==================== FLIGHT TYPE ====================
    flightType: {
      type: String,
      enum: ["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"],
      required: true,
    },

    // ==================== ITINERARIES ====================
    itineraries: [ItinerarySchema],

    // ==================== PASSENGERS ====================
    passengers: [PassengerSchema],
    passengerCount: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
    },

    // ==================== CONTACT INFORMATION ====================
    contact: ContactSchema,

    // ==================== PRICING ====================
    priceDetails: FlightPriceDetailsSchema,
    totalPrice: {
      value: { type: Number, required: true },
      currency: { type: String, required: true },
    },

    // ==================== TICKETING ====================
    ticketingAgreement: {
      option: {
        type: String,
        enum: ["CONFIRM", "DELAY_TO_CANCEL", "DELAY_TO_QUEUE"],
      },
      delay: { type: String }, // e.g., "6D"
      dateTime: { type: Date }, // Ticketing deadline
    },
    ticketingDeadline: { type: Date },
    ticketNumbers: [{ type: String }], // e-Ticket numbers (13 digits)
    instantTicketing: { type: Boolean, default: false },

    // ==================== OPTIONAL SERVICES ====================
    seatSelections: [SeatSelectionSchema],
    baggageAllowance: {
      checkedBags: BaggageSchema,
      cabinBags: BaggageSchema,
    },

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "ticketed",
        "cancelled",
        "failed",
        "expired",
      ],
      default: "pending",
    },

    // ==================== AGENCY REFERENCES ====================
    agency: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    wholesaler: {
      type: Schema.Types.ObjectId,
      ref: "Wholesaler",
      required: true,
    },
    subagent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // ==================== BOOKING CONFIGURATION ====================
    bookingType: {
      type: String,
      enum: ["PAYLATER", "CREDIT", "PAYNOW"],
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["AGENT_CARD", "CREDIT"],
      default: null,
    },

    // ==================== PAYMENTS ====================
    payments: [PaymentSchema],

    // ==================== ADDITIONAL INFORMATION ====================
    remarks: { type: String },
    queuingOfficeId: { type: String },
    automatedProcess: [{ type: Object }],

    // ==================== RAW DATA STORAGE ====================
    flightOfferData: {
      type: Object,
      required: false,
    }, // Complete flight offer from search
    amadeusResponseData: {
      type: Object,
      required: false,
    }, // Complete booking response from Amadeus

    // ==================== SUPPORT ====================
    supportTickets: [
      {
        type: Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],

    // ==================== MODIFICATION ====================
    modified: { type: Boolean, default: false },
    modificationDetails: {
      price: Number,
      markup: Number,
      modifiedAt: { type: Date },
      reason: String,
    },

    // ==================== SOFT CANCELLATION ====================
    softCancelled: { type: Boolean, default: false },
    softCancelledForAgency: { type: Boolean, default: false },
    softCancelledForWholesaler: { type: Boolean, default: false },
    lastReminderSentAt: {
      agency: { type: Date, default: null },
      wholesaler: { type: Date, default: null },
    },

    // ==================== TIMESTAMPS ====================
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
    collection: "flightbookings", // Explicit collection name
  }
);

// ==================== INDEXES ====================
FlightBookingSchema.index({ flightBookingId: 1 });
FlightBookingSchema.index({ pnr: 1 });
FlightBookingSchema.index({ amadeusBookingId: 1 });
FlightBookingSchema.index({ agency: 1, createdAt: -1 });
FlightBookingSchema.index({ wholesaler: 1, createdAt: -1 });
FlightBookingSchema.index({ status: 1 });
FlightBookingSchema.index({ ticketingDeadline: 1 });
FlightBookingSchema.index({ mainBooking: 1 });
FlightBookingSchema.index({ isStandalone: 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
FlightBookingSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Validate passenger count
  if (this.passengers && this.passengers.length > 0) {
    const actualCount = this.passengers.length;
    const expectedCount =
      (this.passengerCount?.adults || 0) +
      (this.passengerCount?.children || 0) +
      (this.passengerCount?.infants || 0);

    if (actualCount !== expectedCount) {
      return next(
        new Error(
          `Passenger count mismatch: expected ${expectedCount}, got ${actualCount}`
        )
      );
    }
  }

  // Validate itineraries
  if (!this.itineraries || this.itineraries.length === 0) {
    return next(new Error("At least one itinerary is required"));
  }

  // Set flight type based on itineraries if not set
  if (!this.flightType) {
    if (this.itineraries.length === 1) {
      this.flightType = "ONE_WAY";
    } else if (this.itineraries.length === 2) {
      this.flightType = "ROUND_TRIP";
    } else {
      this.flightType = "MULTI_CITY";
    }
  }

  next();
});

// ==================== INSTANCE METHODS ====================

// Get first departure date (for sorting)
FlightBookingSchema.methods.getFirstDepartureDate = function () {
  if (this.itineraries && this.itineraries.length > 0) {
    const firstSegment = this.itineraries[0].segments[0];
    return new Date(firstSegment.departure.at);
  }
  return null;
};

// Get last arrival date
FlightBookingSchema.methods.getLastArrivalDate = function () {
  if (this.itineraries && this.itineraries.length > 0) {
    const lastItinerary = this.itineraries[this.itineraries.length - 1];
    const lastSegment =
      lastItinerary.segments[lastItinerary.segments.length - 1];
    return new Date(lastSegment.arrival.at);
  }
  return null;
};

// Get origin airport code
FlightBookingSchema.methods.getOrigin = function () {
  if (this.itineraries && this.itineraries.length > 0) {
    return this.itineraries[0].segments[0].departure.iataCode;
  }
  return null;
};

// Get destination airport code
FlightBookingSchema.methods.getDestination = function () {
  if (this.itineraries && this.itineraries.length > 0) {
    const lastItinerary = this.itineraries[this.itineraries.length - 1];
    const lastSegment =
      lastItinerary.segments[lastItinerary.segments.length - 1];
    return lastSegment.arrival.iataCode;
  }
  return null;
};

// Check if ticketing deadline is passed
FlightBookingSchema.methods.isTicketingExpired = function () {
  if (this.ticketingDeadline) {
    return new Date() > new Date(this.ticketingDeadline);
  }
  return false;
};

// ==================== STATIC METHODS ====================

// Generate sequential booking ID
FlightBookingSchema.statics.generateFlightBookingId = async function () {
  const year = new Date().getFullYear();
  const lastBooking = await this.findOne({
    flightBookingId: new RegExp(`^FLT-${year}-`),
  })
    .sort({ sequenceNumber: -1 })
    .lean();

  const nextSequence = lastBooking ? lastBooking.sequenceNumber + 1 : 1;
  const paddedSequence = String(nextSequence).padStart(4, "0");

  return {
    flightBookingId: `FLT-${year}-${paddedSequence}`,
    sequenceNumber: nextSequence,
  };
};

// Find bookings with upcoming ticketing deadlines
FlightBookingSchema.statics.findUpcomingDeadlines = function (hoursAhead = 24) {
  const now = new Date();
  const deadline = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return this.find({
    ticketingDeadline: {
      $gte: now,
      $lte: deadline,
    },
    status: { $in: ["pending", "confirmed"] },
  });
};

// ==================== EXPORT ====================
// Check if model already exists to avoid OverwriteModelError
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FlightBooking: any =
  mongoose.models.FlightBooking || model("FlightBooking", FlightBookingSchema);
