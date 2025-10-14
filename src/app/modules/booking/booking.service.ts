import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { BookingRequest, BookingResponse, Traveler } from "./booking.interface";
import {
  getAmadeusAccessToken,
  getAmadeusBaseUrl,
} from "../price-list/priceList.utils";

/**
 * Transform simplified traveler data to Amadeus format
 */
function transformTravelers(
  travelers: Traveler[],
  contactEmail: string,
  contactPhone: string,
  contactPhoneCountryCode: string
) {
  return travelers.map((traveler) => {
    const amadeuseTraveler: Record<string, unknown> = {
      id: traveler.id,
      dateOfBirth: traveler.dateOfBirth,
      name: {
        firstName: traveler.firstName.toUpperCase(),
        lastName: traveler.lastName.toUpperCase(),
      },
      gender: traveler.gender,
    };

    // Add contact information
    amadeuseTraveler.contact = {
      emailAddress: traveler.email || contactEmail,
      phones: [
        {
          deviceType: "MOBILE",
          countryCallingCode:
            traveler.phoneCountryCode || contactPhoneCountryCode,
          number: traveler.phoneNumber || contactPhone,
        },
      ],
    };

    // Add documents if provided
    if (traveler.documentNumber) {
      const document: Record<string, unknown> = {
        documentType: traveler.documentType || "PASSPORT",
        number: traveler.documentNumber,
        expiryDate: traveler.documentExpiryDate,
        issuanceCountry: traveler.documentIssuanceCountry,
        nationality: traveler.nationality,
        holder: true,
      };

      // Add optional document fields if provided
      if (traveler.documentIssuanceDate) {
        document.issuanceDate = traveler.documentIssuanceDate;
      }
      if (traveler.birthPlace) {
        document.birthPlace = traveler.birthPlace;
      }
      if (traveler.issuanceLocation) {
        document.issuanceLocation = traveler.issuanceLocation;
      }
      if (traveler.documentIssuanceCountry) {
        document.validityCountry = traveler.documentIssuanceCountry;
      }

      amadeuseTraveler.documents = [document];
    }

    // Add associated adult for infants
    if (traveler.associatedAdultId) {
      amadeuseTraveler.associatedAdultId = traveler.associatedAdultId;
    }

    return amadeuseTraveler;
  });
}

/**
 * Transform booking request to Amadeus Flight Create Orders format
 */
function transformToAmadeusFormat(request: BookingRequest) {
  const amadeusData: Record<string, unknown> = {
    type: "flight-order",
    flightOffers: [request.flightOffer],
    travelers: transformTravelers(
      request.travelers,
      request.contactEmail,
      request.contactPhone,
      request.contactPhoneCountryCode
    ),
    remarks: request.remarks
      ? {
          general: [
            {
              subType: "GENERAL_MISCELLANEOUS",
              text: request.remarks,
            },
          ],
        }
      : undefined,
    ticketingAgreement: request.instantTicketing
      ? {
          option: "CONFIRM", // Immediate ticketing
        }
      : {
          option: "DELAY_TO_CANCEL", // Delayed ticketing
          delay: "6D",
        },
    contacts: [
      {
        addresseeName: {
          firstName: request.travelers[0].firstName.toUpperCase(),
          lastName: request.travelers[0].lastName.toUpperCase(),
        },
        purpose: "STANDARD",
        phones: [
          {
            deviceType: "MOBILE",
            countryCallingCode: request.contactPhoneCountryCode,
            number: request.contactPhone,
          },
        ],
        emailAddress: request.contactEmail,
        address: {
          lines: request.address.lines,
          postalCode: request.address.postalCode,
          cityName: request.address.cityName,
          countryCode: request.address.countryCode,
        },
      },
    ],
  };

  // Add seat selections if provided
  if (request.seatSelections && request.seatSelections.length > 0) {
    amadeusData.seatSelections = request.seatSelections.map((selection) => ({
      segmentId: selection.segmentId,
      travelerIds: selection.travelerIds,
      number: selection.number,
    }));
  }

  return {
    data: amadeusData,
  };
}

/**
 * Create flight booking via Amadeus Flight Create Orders API
 * Endpoint: POST /v1/booking/flight-orders
 * Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-create-orders/api-reference
 */
export const createFlightBooking = async (
  request: BookingRequest
): Promise<BookingResponse> => {
  try {
    // Step 1: Get access token with authorization
    const token = await getAmadeusAccessToken();

    // Step 2: Transform request to Amadeus format
    const amadeusRequest = transformToAmadeusFormat(request);

    // Step 3: Call Amadeus Flight Create Orders API
    const baseUrl = getAmadeusBaseUrl();
    const url = `${baseUrl}/v1/booking/flight-orders`;

    const response = await axios.post(url, amadeusRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const bookingData = response.data.data;

    // Step 4: Extract and return booking information
    const ticketingOption = bookingData.ticketingAgreement?.option;
    const isTicketed = ticketingOption === "CONFIRM";

    // Extract e-ticket number if available (13 digits)
    const eTicketNumber = bookingData.associatedRecords?.find(
      (record: Record<string, unknown>) =>
        typeof record.reference === "string" && record.reference.length === 13
    )?.reference;

    const bookingResponse: BookingResponse = {
      bookingId: bookingData.id,
      pnr: bookingData.associatedRecords[0].reference,
      status: isTicketed ? "TICKETED" : "RESERVED", // TICKETED if instant, RESERVED if delayed
      createdAt: bookingData.associatedRecords[0].creationDate,
      ticketingDeadline: bookingData.ticketingAgreement?.dateTime,
      ticketingOption: ticketingOption, // "CONFIRM" or "DELAY_TO_CANCEL"
      eTicketNumber: eTicketNumber,
      queuingOfficeId: bookingData.queuingOfficeId,
      automatedProcess: bookingData.automatedProcess,
      ticketingAgreement: bookingData.ticketingAgreement,
      flightOffers: bookingData.flightOffers,
      travelers: bookingData.travelers,
      contacts: bookingData.contacts,
      seatSelections: request.seatSelections, // Include seat selections from request (Amadeus doesn't return these)
    };

    return bookingResponse;
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

    // Error creating flight booking

    if (err?.response?.status === 400) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.title ||
        "Invalid booking data. Please check passenger information and flight offer.";
      throw new AppError(httpStatus.BAD_REQUEST, errorDetail);
    }

    if (err?.response?.status === 401) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication failed with Amadeus API. Please check your credentials."
      );
    }

    if (err?.response?.status === 404) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Flight offer not found or no longer available."
      );
    }

    if (err?.response?.status === 409) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Flight price has changed or seats are no longer available. Please re-confirm pricing."
      );
    }

    if (err?.response?.status === 422) {
      const errorDetail =
        err?.response?.data?.errors?.[0]?.detail ||
        "Flight offer has expired. Please get a fresh pricing confirmation.";
      throw new AppError(httpStatus.UNPROCESSABLE_ENTITY, errorDetail);
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create flight booking. Please try again."
    );
  }
};
