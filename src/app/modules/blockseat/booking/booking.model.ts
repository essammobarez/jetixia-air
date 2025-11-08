import { Schema, model, Document, Model } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface IBlockSeatPassenger {
  paxType: "ADT" | "CHD" | "INF";
  title: string;
  firstName: string;
  lastName: string;
  gender?: "M" | "F";
  dob: string; // YYYY-MM-DD
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string; // YYYY-MM-DD
  passportIssueCountry?: string;
}

export interface IBlockSeatContact {
  name: string;
  email: string;
  phoneCode?: string;
  phoneNumber: string;
}

export interface IBlockSeatBooking extends Document {
  reference?: string;
  pnr?: string; // Passenger Name Record - set when status is CONFIRMED
  blockSeat: Schema.Types.ObjectId; // ref to Flight_BlockSeat
  agency: Schema.Types.ObjectId; // Agency placing the booking
  wholesaler?: Schema.Types.ObjectId; // derived from blockSeat if needed
  classId: number;
  trip: {
    tripType: "ONE_WAY" | "ROUND_TRIP";
    departureDate: string;
    returnDate?: string;
  };
  passengers: IBlockSeatPassenger[];
  contact: IBlockSeatContact;
  quantity: number;
  priceSnapshot?: {
    currency: string;
    unitPrice: number;
    totalAmount: number;
    breakdown?: Array<{
      paxType: string;
      count: number;
      unit: number;
      subtotal: number;
    }>;
    commissions?: {
      supplier?: { type: "FIXED_AMOUNT" | "PERCENTAGE"; value: number };
      agency?: { type: "FIXED_AMOUNT" | "PERCENTAGE"; value: number };
    };
  };
  status: BookingStatus;
  notes?: string;
  audit?: Array<{
    at: Date;
    by?: Schema.Types.ObjectId;
    action: string;
    meta?: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PassengerSchema = new Schema<IBlockSeatPassenger>(
  {
    paxType: { type: String, enum: ["ADT", "CHD", "INF"], required: true },
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ["M", "F"] },
    dob: { type: String, required: true },
    nationality: { type: String },
    passportNumber: { type: String },
    passportExpiry: { type: String },
    passportIssueCountry: { type: String },
  },
  { _id: false }
);

const ContactSchema = new Schema<IBlockSeatContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneCode: { type: String },
    phoneNumber: { type: String, required: true },
  },
  { _id: false }
);

const BlockSeatBookingSchema = new Schema<IBlockSeatBooking>(
  {
    reference: { type: String, index: true, unique: true },
    pnr: { type: String, index: true }, // Passenger Name Record
    blockSeat: {
      type: Schema.Types.ObjectId,
      ref: "Flight_BlockSeat",
      required: true,
    },
    agency: { type: Schema.Types.ObjectId, ref: "Agency", required: true },
    wholesaler: { type: Schema.Types.ObjectId, ref: "Wholesaler" },
    classId: { type: Number, required: true },
    trip: {
      tripType: {
        type: String,
        enum: ["ONE_WAY", "ROUND_TRIP"],
        required: true,
      },
      departureDate: { type: String, required: true },
      returnDate: { type: String },
    },
    passengers: { type: [PassengerSchema], required: true },
    contact: { type: ContactSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: {
      currency: { type: String },
      unitPrice: { type: Number },
      totalAmount: { type: Number },
      breakdown: [
        { paxType: String, count: Number, unit: Number, subtotal: Number },
      ],
      commissions: {
        supplier: { type: { type: String }, value: Number },
        agency: { type: { type: String }, value: Number },
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    notes: { type: String },
    audit: [
      {
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        action: { type: String, required: true },
        meta: { type: Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
    collection: "blockseat_bookings",
  }
);

BlockSeatBookingSchema.index({
  blockSeat: 1,
  classId: 1,
  "trip.departureDate": 1,
});
BlockSeatBookingSchema.index({ status: 1, createdAt: -1 });

export const BlockSeatBooking: Model<IBlockSeatBooking> =
  model<IBlockSeatBooking>("BlockSeatBooking", BlockSeatBookingSchema);
