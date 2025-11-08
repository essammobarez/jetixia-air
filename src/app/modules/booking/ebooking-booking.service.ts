import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  EbookingBookingRequest,
  EbookingBookingResponse,
} from "./ebooking-booking.interface";
import {
  getEbookingAccessToken,
  getEbookingBaseUrl,
} from "../price-list/ebooking.utils";

/**
 * Create flight booking via ebooking API
 * Endpoint: POST /tbs/reseller/api/flights/v1/search/results/{srk}/offers/{offerIndex}/book
 */
export const createEbookingBooking = async (
  srk: string,
  offerIndex: string,
  request: EbookingBookingRequest
): Promise<EbookingBookingResponse> => {
  try {
    // Get access token
    const accessToken = await getEbookingAccessToken();

    // Build booking API URL
    const baseUrl = getEbookingBaseUrl();
    const bookingUrl = `${baseUrl}/tbs/reseller/api/flights/v1/search/results/${srk}/offers/${offerIndex}/book`;

    // Call ebooking booking API
    const response = await axios.post(bookingUrl, request, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data as EbookingBookingResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        data?: {
          errors?: Array<{ detail?: string; title?: string; code?: number }>;
        };
      };
      message?: string;
    };

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid booking data. Please check passenger information.";
      throw new AppError(httpStatus.BAD_REQUEST, errorDetail);
    }

    if (err?.response?.status === 401) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication failed with ebooking API."
      );
    }

    if (err?.response?.status === 404) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Offer not found or no longer available."
      );
    }

    if (err?.response?.status === 409) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Flight price has changed or seats are no longer available."
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create booking via ebooking API"
    );
  }
};



