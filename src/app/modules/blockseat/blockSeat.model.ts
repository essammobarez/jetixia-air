import mongoose, { model, Schema } from "mongoose";

// ==================== ROUTE SCHEMA ====================
const RouteSchema = new Schema(
  {
    from: {
      country: { type: String, required: true },
      iataCode: { type: String, required: true },
    },
    to: {
      country: { type: String, required: true },
      iataCode: { type: String, required: true },
    },
    tripType: {
      type: String,
      enum: ["ONE_WAY", "ROUND_TRIP"],
      required: true,
    },
  },
  { _id: false }
);

// ==================== CLASS INVENTORY SCHEMA ====================
const ClassInventorySchema = new Schema(
  {
    classId: { type: Number, required: true },
    className: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

// ==================== FARE RULES SCHEMA ====================
const FareRulesSchema = new Schema(
  {
    template: {
      type: String,
      enum: [
        "FLEXIBLE",
        "SEMI_FLEXIBLE",
        "STANDARD",
        "RESTRICTED",
        "NON_REFUNDABLE",
        "MANUAL_ENTRY",
      ],
      default: "MANUAL_ENTRY",
    },
    refundable: { type: Boolean, default: false },
    changeFee: { type: Number, default: 0 },
    cancellationFee: { type: Number, default: 0 },
  },
  { _id: false }
);

// ==================== BAGGAGE ALLOWANCE SCHEMA ====================
const BaggageAllowanceSchema = new Schema(
  {
    checkedBags: { type: Number, default: 0 },
    weightPerBag: { type: String, default: "0kg" },
    carryOnWeight: { type: String, default: "0kg" },
  },
  { _id: false }
);

// ==================== COMMISSION SCHEMA ====================
const CommissionSchema = new Schema(
  {
    supplierCommission: {
      type: {
        type: String,
        enum: ["FIXED_AMOUNT", "PERCENTAGE"],
        default: "FIXED_AMOUNT",
      },
      value: { type: Number, default: 0 },
    },
    agencyCommission: {
      type: {
        type: String,
        enum: ["FIXED_AMOUNT", "PERCENTAGE"],
        default: "FIXED_AMOUNT",
      },
      value: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// ==================== AVAILABLE DATES SCHEMA ====================
const AvailableDatesSchema = new Schema(
  {
    departureDate: { type: String, required: true }, // YYYY-MM-DD format
    returnDate: { type: String }, // Optional, only for ROUND_TRIP
  },
  { _id: false }
);

// ==================== MAIN BLOCK SEAT SCHEMA ====================
const BlockSeatSchema = new Schema(
  {
    // ==================== BASIC INFO ====================
    name: {
      type: String,
      required: true,
    },

    // ==================== AIRLINE INFORMATION ====================
    airline: {
      code: { type: String, required: true },
      name: { type: String, required: true },
      country: { type: String },
    },

    // ==================== ROUTE INFORMATION ====================
    route: RouteSchema,

    // ==================== AVAILABLE DATES ====================
    availableDates: [AvailableDatesSchema],

    // ==================== CLASS INVENTORY ====================
    classes: [ClassInventorySchema],

    // ==================== PRICING ====================
    currency: { type: String, required: true, default: "USD" },

    // ==================== FARE RULES ====================
    fareRules: FareRulesSchema,

    // ==================== BAGGAGE ALLOWANCE ====================
    baggageAllowance: BaggageAllowanceSchema,

    // ==================== COMMISSION ====================
    commission: CommissionSchema,

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },

    // ==================== WHOLESALER REFERENCE ====================
    wholesaler: {
      type: Schema.Types.ObjectId,
      ref: "Wholesaler",
      required: true,
    },

    // ==================== ADDITIONAL INFORMATION ====================
    remarks: { type: String },
    autoRelease: { type: Boolean, default: false }, // Auto-release unsold seats
    releaseDate: { type: Date }, // When to release unsold seats

    // ==================== TIMESTAMPS ====================
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "blockseats",
  }
);

// ==================== INDEXES ====================
BlockSeatSchema.index({ name: 1 });
BlockSeatSchema.index({ wholesaler: 1, createdAt: -1 });
BlockSeatSchema.index({ "airline.code": 1 });
BlockSeatSchema.index({ "route.from.iataCode": 1, "route.to.iataCode": 1 });
BlockSeatSchema.index({ availableDates: 1 });
BlockSeatSchema.index({ status: 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
BlockSeatSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Calculate available seats for each class
  if (this.classes && this.classes.length > 0) {
    this.classes.forEach((classItem) => {
      classItem.availableSeats = classItem.totalSeats - classItem.bookedSeats;
    });
  }

  // Validate classes
  if (!this.classes || this.classes.length === 0) {
    return next(new Error("At least one class is required"));
  }

  // Validate available dates
  if (!this.availableDates || this.availableDates.length === 0) {
    return next(new Error("At least one available date is required"));
  }

  // Validate dates based on trip type
  if (this.route && this.route.tripType === "ROUND_TRIP") {
    for (const dateObj of this.availableDates) {
      if (!dateObj.returnDate) {
        return next(
          new Error("Return date is required for ROUND_TRIP bookings")
        );
      }
    }
  }

  next();
});

// ==================== INSTANCE METHODS ====================

// Get total seats across all classes
BlockSeatSchema.methods.getTotalSeats = function () {
  return this.classes.reduce(
    (total: number, classItem: any) => total + classItem.totalSeats,
    0
  );
};

// Get total booked seats across all classes
BlockSeatSchema.methods.getTotalBookedSeats = function () {
  return this.classes.reduce(
    (total: number, classItem: any) => total + classItem.bookedSeats,
    0
  );
};

// Get total available seats across all classes
BlockSeatSchema.methods.getTotalAvailableSeats = function () {
  return this.classes.reduce(
    (total: number, classItem: any) => total + classItem.availableSeats,
    0
  );
};

// Get total revenue across all classes
BlockSeatSchema.methods.getTotalRevenue = function () {
  return this.classes.reduce((total: number, classItem: any) => {
    return total + classItem.bookedSeats * classItem.price;
  }, 0);
};

// Check if block has available seats for a specific class and date
BlockSeatSchema.methods.hasAvailableSeats = function (
  classId: number,
  departureDate: string,
  returnDate?: string,
  requiredSeats: number = 1
) {
  const classItem = this.classes.find((c: any) => c.classId === classId);
  if (!classItem) return false;

  // Check if the date combination exists
  const isDateAvailable = this.availableDates.some((dateObj: any) => {
    if (this.route.tripType === "ONE_WAY") {
      return dateObj.departureDate === departureDate;
    } else {
      return (
        dateObj.departureDate === departureDate &&
        dateObj.returnDate === returnDate
      );
    }
  });

  const hasEnoughSeats = classItem.availableSeats >= requiredSeats;

  return isDateAvailable && hasEnoughSeats;
};

// ==================== STATIC METHODS ====================

// Find blocks by wholesaler
BlockSeatSchema.statics.findByWholesaler = function (
  wholesalerId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  return this.find({ wholesaler: wholesalerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// ==================== EXPORT ====================
export const BlockSeat = model<any>("BlockSeat", BlockSeatSchema);
