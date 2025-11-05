import mongoose, { Schema, Document } from "mongoose";

export interface ISupplierConnection extends Document {
  supplier: mongoose.Types.ObjectId;
  wholesaler: mongoose.Types.ObjectId;
  credentials: Record<string, unknown>;
  active: boolean;
  valid: boolean;
  connectedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const supplierConnectionSchema = new Schema<ISupplierConnection>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    wholesaler: {
      type: Schema.Types.ObjectId,
      ref: "Wholesaler",
      required: true,
    },
    credentials: { type: Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true },
    valid: { type: Boolean, default: false },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SupplierConnectionModel: mongoose.Model<ISupplierConnection> =
  (mongoose.models.SupplierConnection as mongoose.Model<ISupplierConnection>) ||
  mongoose.model<ISupplierConnection>(
    "SupplierConnection",
    supplierConnectionSchema
  );

export default SupplierConnectionModel;
export { SupplierConnectionModel as SupplierConnection };
