import { Schema, model, Document, Types } from "mongoose";

export interface ILocation extends Document {
  id: number;                  
  name: string;                
  code: string;                
  services: string[];          
  supplier: Types.ObjectId;   
}

const LocationSchema = new Schema<ILocation>(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      
    },
    services: {
      type: [String],
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

export const Location = model<ILocation>(
  "Location",
  LocationSchema,
  "locations_flight_ebooking"   
);
