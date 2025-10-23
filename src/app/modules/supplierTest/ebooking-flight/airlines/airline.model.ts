import { Schema, model, Document, Types } from "mongoose";

export interface IAirline extends Document {
  code: string;             
  name: string;              
  supplier: Types.ObjectId; 
}

const AirlineSchema = new Schema<IAirline>(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
   
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
  },
  { timestamps: true }
);

export const Airline = model<IAirline>(
  "Airline",
  AirlineSchema,
  "airlines_ebooking"
);
