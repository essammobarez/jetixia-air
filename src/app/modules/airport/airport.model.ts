import { Schema, model, Document } from "mongoose";

export interface IAirport extends Document {
  id: number;
  ident: string;
  type: string;
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_ft: number;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  icao_code: string;
  iata_code: string;
  gps_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
}

const AirportSchema = new Schema<IAirport>(
  {
    id: { type: Number, required: true, unique: true },
    ident: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    latitude_deg: { type: Number, required: true },
    longitude_deg: { type: Number, required: true },
    elevation_ft: { type: Number, required: true },
    continent: { type: String, required: true, trim: true },
    iso_country: { type: String, required: true, trim: true },
    iso_region: { type: String, required: true, trim: true },
    municipality: { type: String, required: true, trim: true },
    scheduled_service: { type: String, required: true, trim: true },
    icao_code: { type: String, required: true, trim: true },
    iata_code: { type: String, required: true, trim: true },
    gps_code: { type: String, required: true, trim: true },
    local_code: { type: String, required: true, trim: true },
    home_link: { type: String, required: true, trim: true },
    wikipedia_link: { type: String, required: true, trim: true },
    keywords: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Airport = model<IAirport>("Airport", AirportSchema, "airports");
