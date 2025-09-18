// src/modules/flights/checkFlightAvailability.service.ts
import axios from "axios";
import { getAccessToken } from "../utils";

const BASE_URL = process.env.BASE_URL;

export const checkFlightAvailabilityService = async (
  srk: string,
  offerIndex: string | number,
  body: any
) => {
  const accesstoken = await getAccessToken();
  const url = `${BASE_URL}/api/flights/v1/search/results/${srk}/offers/${offerIndex}/availability?token=${body.token}`;

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accesstoken}`,
      "Content-Type": "application/json",
    },
  });
console.log(response.data)
  return response.data;
};
