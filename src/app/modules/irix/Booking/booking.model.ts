import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  bookingId: string;
  passengerName: string;
  passengerEmail: string;
  flightDetails: {
    departure: string;
    arrival: string;
    date: Date;
    flightNumber: string;
  };
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    passengerName: {
      type: String,
      required: true,
    },
    passengerEmail: {
      type: String,
      required: true,
    },
    flightDetails: {
      departure: {
        type: String,
        required: true,
      },
      arrival: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      flightNumber: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);













