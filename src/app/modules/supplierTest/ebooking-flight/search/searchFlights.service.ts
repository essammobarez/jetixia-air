import axios from "axios";
import { getAccessToken } from "../utils";

const BASE_URL = process.env.BASE_URL;

export const searchFlightsService = async (payload: any) => {
  const token = await getAccessToken();
  const url = `${BASE_URL}/api/flights/v1/search`;

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
