import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { SeatMapRequest, SeatMapResponse } from "./seatmap.interface";
import {
  getAmadeusAccessToken,
  getAmadeusBaseUrl,
} from "../price-list/priceList.utils";

/**
 * Get seat maps for flight offers
 * Endpoint: POST /v1/shopping/seatmaps
 * Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/seatmap-display
 */
export const getSeatMaps = async (
  request: SeatMapRequest
): Promise<SeatMapResponse> => {
  try {
    // Step 1: Get access token with authorization
    const token = await getAmadeusAccessToken();

    // Step 2: Build request body
    const requestBody = {
      data: request.flightOffers,
    };

    // Step 3: Call Amadeus SeatMap API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/shopping/seatmaps`;

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const seatMapResponse: SeatMapResponse = response.data;

    return seatMapResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        data?: {
          errors?: Array<{ detail?: string; title?: string }>;
        };
      };
      message?: string;
    };

    // Error fetching seat maps

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid flight offer data for seat map request";
      throw new AppError(httpStatus.BAD_REQUEST, errorDetail);
    }

    if (err?.response?.status === 401) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication failed with Amadeus API."
      );
    }

    if (err?.response?.status === 404) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Seat map not available for this flight. The airline may not provide seat maps via this channel."
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to retrieve seat maps from Amadeus API"
    );
  }
};
