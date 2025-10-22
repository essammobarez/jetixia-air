/* eslint-disable @typescript-eslint/no-this-alias */

import mongoose, { Schema, model } from "mongoose";

import { TUser, UserModel } from "./user.interface";
const userSchema = new Schema<TUser>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: [
        "user",
        "ADMIN",
        "agency_admin",
        "whole_saler",
        "sub_agent",
        "sales",
      ],
      default: "user",
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 1,
      required: function (this: any) {
        return this.role === "sales";
      },
    },
    profileImage: {
      data: Buffer,
      contentType: String,
    },
    // Subscription Object
    subscription: {
      isActive: {
        type: Boolean,
        default: false,
      },
      stripeCustomerId: {
        type: String,
        default: null,
      },
      subscriptionId: {
        type: String,
        default: null,
      },
      currentPlan: {
        type: String, // e.g., "Basic", "Pro"
        default: null,
      },
      planInterval: {
        type: String, // e.g., "month", "year"
        default: null,
      },
      subscriptionStart: {
        type: Date,
        default: null,
      },
      subscriptionEnd: {
        type: Date,
        default: null,
      },
      autoRenew: {
        type: Boolean,
        default: false,
      },
    },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
    wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: "Wholesaler" },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    webAuth: {
      type: Boolean,
      default: true,
    },
    googleAuth: {
      type: Boolean,
      default: false,
    },
    secretKey: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

userSchema.statics.isUserExist = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return givenPassword === savedPassword;
};

userSchema.pre("save", function (next) {
  if (this.role === "agency_admin" && !this.agency) {
    throw new Error("Agency admin must be associated with an agency");
  }
  next();
});

userSchema.pre("save", function (next) {
  if (this.role === "sales" && !this.wholesaler) {
    throw new Error("Sales must be associated with a wholesaler");
  }
  next();
});

export const User = model<TUser, UserModel>("User", userSchema);
