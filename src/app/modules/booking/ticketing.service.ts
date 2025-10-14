import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { TicketingRequest, TicketingResponse } from "./ticketing.interface";
import {
  getAmadeusAccessToken,
  getAmadeusBaseUrl,
} from "../price-list/priceList.utils";

/**
 * Issue ticket for a delayed booking (convert RESERVED to TICKETED)
 * Endpoint: POST /v1/booking/flight-orders/{flightOrderId}/ticketing
 * Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-order-management
 */
export const issueTicket = async (
  request: TicketingRequest
): Promise<TicketingResponse> => {
  try {
    // Step 1: Get access token
    const token = await getAmadeusAccessToken();

    // Step 2: Call Amadeus Flight Order Ticketing API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/booking/flight-orders/${request.bookingId}/ticketing`;

    const response = await axios.post(
      url,
      {}, // Empty body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const ticketingData = response.data.data;

    // Step 3: Extract e-ticket number (13 digits)
    const eTicketNumber = ticketingData.associatedRecords?.find(
      (record: Record<string, unknown>) =>
        typeof record.reference === "string" && record.reference.length === 13
    )?.reference;

    // Step 4: Extract PNR (6 characters)
    const pnr =
      ticketingData.associatedRecords?.find(
        (record: Record<string, unknown>) =>
          record.originSystemCode === "GDS" &&
          typeof record.reference === "string" &&
          record.reference.length === 6
      )?.reference || ticketingData.associatedRecords?.[0]?.reference;

    const ticketingResponse: TicketingResponse = {
      success: true,
      bookingId: ticketingData.id,
      pnr: pnr,
      status: "TICKETED", // Now ticketed!
      eTicketNumber: eTicketNumber,
      ticketingAgreement: ticketingData.ticketingAgreement,
      associatedRecords: ticketingData.associatedRecords,
    };

    return ticketingResponse;
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

    // Error issuing ticket

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid booking ID or ticketing request.";
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
        "Booking not found or already ticketed."
      );
    }

    if (err?.response?.status === 409) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Booking cannot be ticketed. May have expired or been cancelled."
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to issue ticket. Please try again."
    );
  }
};
