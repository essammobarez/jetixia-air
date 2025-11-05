import axios from "axios";
import { getAccessToken } from "../utils";

const BASE_URL = process.env.BASE_URL;

export const bookFlightService = async (
  srk: string,
  offerIndex: string,
  searchToken: string,
  wholesalerId:string,
  supplierId:string,
  body: {
    availabilityToken: string;
    clientRef: string;
    travelers: {
      ptc: string;
      reference: string;
      type: string;
      title: string;
      firstName: string;
      lastName: string;
    }[];
  }
) => {
  const accessToken = await getAccessToken(supplierId,wholesalerId);

  const url = `${BASE_URL}/api/flights/v1/search/results/${srk}/offers/${offerIndex}/book?token=${encodeURIComponent(searchToken)}`;

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
