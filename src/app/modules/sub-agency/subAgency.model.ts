import mongoose, { Schema, model } from "mongoose";

export interface ISubAgent {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  agency: mongoose.Schema.Types.ObjectId;
  status: "active" | "inactive";
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
  permissions: string[];
}

const subAgentSchema = new Schema<ISubAgent>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    // role: { type: String },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    profileImage: {
      data: Buffer,
      contentType: String,
    },
    permissions: { type: [String] },
  },
  {
    timestamps: true,
  }
);

export const SubAgent = model<ISubAgent>("SubAgent", subAgentSchema);
