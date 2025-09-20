import { FilterQuery } from "mongoose";
import { Airline, IAirline } from "./airline.model";

export const searchAirlines = async (query: string): Promise<IAirline[]> => {
  const filter: FilterQuery<IAirline> = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { code: { $regex: query, $options: "i" } },
    ],
  };

  return Airline.find(filter).exec();
};
