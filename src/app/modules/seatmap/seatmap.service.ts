import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { SeatMapRequest, SeatMapResponse } from "./seatmap.interface";
import {
  getAmadeusAccessToken,
  getAmadeusBaseUrl,
} from "../price-list/priceList.utils";
import { getEbookingSeatMap } from "../price-list/ebooking.service";

/**
 * Handle ebooking seat map request
 */
async function handleEbookingSeatMap(request: SeatMapRequest) {
  try {
    // Validate ebooking request parameters
    if (
      !request.srk ||
      !request.offerIndex ||
      !request.token ||
      !request.availabilityToken ||
      !request.segmentReference
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Missing required ebooking seatmap parameters: srk, offerIndex, token, availabilityToken, and segmentReference are required"
      );
    }

    console.log("=== EBOOKING SEATMAP API REQUEST START ===");

    // Call ebooking seat map API
    const ebookingResponse = await getEbookingSeatMap(
      request.srk,
      request.offerIndex,
      request.token,
      request.availabilityToken,
      request.segmentReference
    );

    console.log("✅ ebooking seatmap successful");
    console.log("=== EBOOKING SEATMAP API REQUEST END ===\n");

    // Return ebooking response as-is (no transformation)
    return ebookingResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: { status: number; data: unknown };
      message?: string;
    };

    console.error("❌ ebooking seatmap error:", err);

    if (err?.response?.status === 400) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid ebooking seatmap request"
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get seat map from ebooking API"
    );
  }
}

/**
 * Get seat maps for flight offers
 * Supports both Amadeus and ebooking suppliers
 */
export const getSeatMaps = async (request: SeatMapRequest): Promise<any> => {
  // Detect supplier
  const supplier = request.supplier || (request.srk ? "ebooking" : "amadeus");

  // Handle ebooking
  if (supplier === "ebooking") {
    return await handleEbookingSeatMap(request);
  }

  // Handle Amadeus (existing flow)
  try {
    console.log("=== SEATMAP API REQUEST START ===");

    // Step 1: Get access token with authorization
    const token = await getAmadeusAccessToken();
    console.log("✓ Access token obtained");

    // Step 2: Build request body
    const requestBody = {
      data: request.flightOffers,
    };
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    // Step 3: Call Amadeus SeatMap API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/shopping/seatmaps`;
    console.log("API URL:", url);

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✓ Seatmap API Response Status:", response.status);
    console.log("=== SEATMAP API REQUEST END ===\n");

    const seatMapResponse: SeatMapResponse = response.data;

    return seatMapResponse;
  } catch (error: unknown) {
    console.error("=== SEATMAP API ERROR ===");

    const err = error as {
      response?: {
        status: number;
        data?: {
          errors?: Array<{ detail?: string; title?: string }>;
        };
      };
      message?: string;
    };

    // Log raw error details from supplier API
    if (err?.response) {
      console.error("❌ Supplier API Error Status:", err.response.status);
      console.error(
        "❌ Supplier API Raw Error:",
        JSON.stringify(err.response.data, null, 2)
      );
    } else {
      console.error("❌ Request Error:", err?.message || error);
    }
    console.error("=== SEATMAP API ERROR END ===\n");

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
