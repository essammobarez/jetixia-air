import { Airport, IAirport } from "./airport.model";

/**
 * Airport search result interface
 */
export interface AirportSearchResult {
  _id: string;
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

/**
 * AirportSearchService provides search functionality for airports.
 * Searches by name and municipality with partial matching.
 */
export class AirportSearchService {
  /**
   * Searches airports by name and municipality.
   * Uses partial matching (contains) for both name and municipality fields.
   * Returns paginated results.
   */
  async searchAirports(
    queryParams: Record<string, any>
  ): Promise<{ airports: AirportSearchResult[]; total: number }> {
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const skip = (page - 1) * limit;
    const term = String(queryParams.searchTerm || "").trim();

    // Create search conditions for name and municipality
    const searchConditions: any = {};

    if (term) {
      const searchRegex = new RegExp(term, "i");
      searchConditions.$or = [
        { name: searchRegex },
        { municipality: searchRegex },
      ];
    }

    // Get total count for pagination
    const total = await Airport.countDocuments(searchConditions);

    // Search airports with pagination
    const airportDocs = await Airport.find(searchConditions)
      .skip(skip)
      .limit(limit)
      .lean();

    const airports: AirportSearchResult[] = airportDocs.map((airport) => ({
      _id: airport._id.toString(),
      id: airport.id,
      ident: airport.ident,
      type: airport.type,
      name: airport.name,
      latitude_deg: airport.latitude_deg,
      longitude_deg: airport.longitude_deg,
      elevation_ft: airport.elevation_ft,
      continent: airport.continent,
      iso_country: airport.iso_country,
      iso_region: airport.iso_region,
      municipality: airport.municipality,
      scheduled_service: airport.scheduled_service,
      icao_code: airport.icao_code,
      iata_code: airport.iata_code,
      gps_code: airport.gps_code,
      local_code: airport.local_code,
      home_link: airport.home_link,
      wikipedia_link: airport.wikipedia_link,
      keywords: airport.keywords,
    }));

    return { airports, total };
  }

  /**
   * Get airport by ID
   */
  async getAirportById(id: string): Promise<AirportSearchResult | null> {
    const airport = await Airport.findById(id).lean();

    if (!airport) {
      return null;
    }

    return {
      _id: airport._id.toString(),
      id: airport.id,
      ident: airport.ident,
      type: airport.type,
      name: airport.name,
      latitude_deg: airport.latitude_deg,
      longitude_deg: airport.longitude_deg,
      elevation_ft: airport.elevation_ft,
      continent: airport.continent,
      iso_country: airport.iso_country,
      iso_region: airport.iso_region,
      municipality: airport.municipality,
      scheduled_service: airport.scheduled_service,
      icao_code: airport.icao_code,
      iata_code: airport.iata_code,
      gps_code: airport.gps_code,
      local_code: airport.local_code,
      home_link: airport.home_link,
      wikipedia_link: airport.wikipedia_link,
      keywords: airport.keywords,
    };
  }

  /**
   * Get all airports with pagination
   */
  async getAllAirports(
    queryParams: Record<string, any>
  ): Promise<{ airports: AirportSearchResult[]; total: number }> {
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const skip = (page - 1) * limit;

    const total = await Airport.countDocuments();
    const airportDocs = await Airport.find().skip(skip).limit(limit).lean();

    const airports: AirportSearchResult[] = airportDocs.map((airport) => ({
      _id: airport._id.toString(),
      id: airport.id,
      ident: airport.ident,
      type: airport.type,
      name: airport.name,
      latitude_deg: airport.latitude_deg,
      longitude_deg: airport.longitude_deg,
      elevation_ft: airport.elevation_ft,
      continent: airport.continent,
      iso_country: airport.iso_country,
      iso_region: airport.iso_region,
      municipality: airport.municipality,
      scheduled_service: airport.scheduled_service,
      icao_code: airport.icao_code,
      iata_code: airport.iata_code,
      gps_code: airport.gps_code,
      local_code: airport.local_code,
      home_link: airport.home_link,
      wikipedia_link: airport.wikipedia_link,
      keywords: airport.keywords,
    }));

    return { airports, total };
  }
}

export const airportSearchService = new AirportSearchService();
