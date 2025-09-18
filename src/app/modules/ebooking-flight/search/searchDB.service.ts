import { Location } from "../flight.model";

export async function searchLocationByName(name: string) {
  if (!name || name.trim() === "") {
    throw new Error("Name is required for search");
  } 

  console.log("Searching for:", name);
  const regex = new RegExp(name.trim(), "i"); 
  const results = await Location.find({ name: regex }).lean();
  console.log("Results:", results);
  return results;
}
