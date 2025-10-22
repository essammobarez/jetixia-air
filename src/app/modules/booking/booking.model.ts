import mongoose, { model } from "mongoose";

// Passenger/Traveler Schema for Flights
const PassengerSchema = new mongoose.Schema(
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

// Flight Segment Schema
const FlightSegmentSchema = new mongoose.Schema(
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

// Itinerary Schema (collection of segments for one direction)
const ItinerarySchema = new mongoose.Schema(
  {
    duration: { type: String },
    segments: [FlightSegmentSchema],
  },
  { _id: false }
);

// Pricing Details Schema for Flights
const FlightPriceDetailsSchema = new mongoose.Schema(
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

// Baggage Allowance Schema
const BaggageSchema = new mongoose.Schema(
  {
    quantity: Number,
    weight: Number,
    weightUnit: String,
  },
  { _id: false }
);

// Seat Selection Schema
const SeatSelectionSchema = new mongoose.Schema(
  {
    segmentId: { type: String, required: true },
    travelerIds: [{ type: String }],
    number: { type: String, required: true }, // e.g., "12A"
  },
  { _id: false }
);

// Contact Information Schema
const ContactSchema = new mongoose.Schema(
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

// Payment Schema (reusable)
const PaymentSchema = new mongoose.Schema(
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

// Main Flight Booking Schema
const FlightBookingSchema = new mongoose.Schema(
  {
    // Booking Identifiers
    bookingId: { type: String, required: true, unique: true }, // Our internal booking ID
    sequenceNumber: { type: Number, required: true },
    pnr: { type: String, required: true }, // Amadeus PNR (Passenger Name Record)
    amadeusBookingId: { type: String, required: true }, // Amadeus booking ID

    // Status
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

    // Agency and User References
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wholesaler",
      required: true,
    },
    subagent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Flight Details
    flightType: {
      type: String,
      enum: ["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"],
      required: true,
    },
    itineraries: [ItinerarySchema],

    // Passenger Information
    passengers: [PassengerSchema],
    passengerCount: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
    },

    // Contact Information
    contact: ContactSchema,

    // Pricing Information
    priceDetails: FlightPriceDetailsSchema,
    totalPrice: {
      value: { type: Number, required: true },
      currency: { type: String, required: true },
    },

    // Ticketing Information
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

    // Optional Services
    seatSelections: [SeatSelectionSchema],
    baggageAllowance: {
      checkedBags: BaggageSchema,
      cabinBags: BaggageSchema,
    },

    // Booking Configuration
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
    instantTicketing: { type: Boolean, default: false },

    // Payments
    payments: [PaymentSchema],

    // Additional Information
    remarks: { type: String },
    queuingOfficeId: { type: String },
    automatedProcess: [{ type: Object }],

    // Raw Data Storage
    flightOfferData: { type: Object }, // Complete flight offer from Amadeus
    amadeusResponseData: { type: Object }, // Complete Amadeus booking response

    // Support and Modification
    supportTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
    modified: { type: Boolean, default: false },
    modificationDetails: {
      price: Number,
      markup: Number,
      modifiedAt: { type: Date },
      reason: String,
    },

    // Soft Cancellation
    softCancelled: { type: Boolean, default: false },
    softCancelledForAgency: { type: Boolean, default: false },
    softCancelledForWholesaler: { type: Boolean, default: false },
    lastReminderSentAt: {
      agency: { type: Date, default: null },
      wholesaler: { type: Date, default: null },
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
FlightBookingSchema.index({ bookingId: 1 });
FlightBookingSchema.index({ pnr: 1 });
FlightBookingSchema.index({ amadeusBookingId: 1 });
FlightBookingSchema.index({ agency: 1, createdAt: -1 });
FlightBookingSchema.index({ wholesaler: 1, createdAt: -1 });
FlightBookingSchema.index({ status: 1 });
FlightBookingSchema.index({ ticketingDeadline: 1 });

// Pre-save middleware to update timestamps
FlightBookingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const FlightBooking = model<any>("FlightBooking", FlightBookingSchema);
