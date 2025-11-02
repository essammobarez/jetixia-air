import mongoose, { Schema, model } from "mongoose";



const wholesalerSchema = new Schema<any>(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
    wholesalerName: { type: String, required: true },
    slug: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    postCode: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String, required: false },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    businessCurrency: { type: String, required: false },
    vat: { type: String, required: false },
    licenseUrl: { type: String, required: false, default: null },
    logo: {
      type: String,
      required: false,
      default: null,
    },
    title: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    emailId: { type: String, required: true },
    designation: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    emailConfig: { type: String, required: false },
    supplierConnections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider",
      },
    ],
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Wholesaler = model<any>("Wholesaler", wholesalerSchema);