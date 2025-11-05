import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { BookingRequest, BookingResponse, Traveler } from "./booking.interface";
import {
  getAmadeusAccessToken,
  getAmadeusBaseUrl,
} from "../price-list/priceList.utils";
import { FlightBooking } from "./booking.model";
import { createEbookingBooking } from "./ebooking-booking.service";
import { EbookingBookingRequest } from "./ebooking-booking.interface";
import { generateBookingSlug } from "./booking.utils";
import mongoose from "mongoose";

/**
 * Fetch agency and wholesaler slugs from database
 */
async function getAgencyWholesalerSlugs(
  wholesalerId?: string,
  agencyId?: string
): Promise<{ wholesalerSlug?: string; agencySlug?: string }> {
  try {
    let wholesalerSlug: string | undefined;
    let agencySlug: string | undefined;

    // Fetch wholesaler slug
    if (wholesalerId && mongoose.Types.ObjectId.isValid(wholesalerId)) {
      const Wholesaler = mongoose.model("Wholesaler");
      const wholesaler = await Wholesaler.findById(wholesalerId).select("slug");
      wholesalerSlug = wholesaler?.slug;
    }

    // Fetch agency slug
    if (agencyId && mongoose.Types.ObjectId.isValid(agencyId)) {
      const Agency = mongoose.model("Agency");
      const agency = await Agency.findById(agencyId).select("slug");
      agencySlug = agency?.slug;
    }

    return { wholesalerSlug, agencySlug };
  } catch (error) {
    // If error fetching slugs, return undefined (will fallback to simple format)
    return {};
  }
}

/**
 * Extract srk and offerIndex from availabilityToken or request
 */
function extractEbookingBookingParams(request: BookingRequest): {
  srk: string;
  offerIndex: string;
} {
  // These should be passed in the request metadata or extracted from the availability flow
  // For now, we'll require them to be passed explicitly
  const srk = (request as any).srk;
  const offerIndex = (request as any).offerIndex;

  if (!srk || !offerIndex) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Missing required ebooking booking parameters: srk and offerIndex"
    );
  }

  return { srk, offerIndex };
}

/**
 * Transform BookingRequest travelers to ebooking format
 */
function transformToEbookingTravelers(
  travelers: Traveler[]
): EbookingBookingRequest["travelers"] {
  return travelers.map((traveler) => ({
    reference: traveler.reference || traveler.id || "",
    type: traveler.type || "adult",
    ptc: traveler.ptc || "ADT",
    lead: traveler.lead || false,
    title: traveler.title || "mr",
    firstName: traveler.firstName,
    lastName: traveler.lastName,
    birthDate: traveler.birthDate || traveler.dateOfBirth,
    email: traveler.email || "",
    phonePrefix: traveler.phonePrefix || traveler.phoneCountryCode || "",
    phone: traveler.phone || traveler.phoneNumber || "",
    identificationDocument: traveler.identificationDocument
      ? {
          documentType: traveler.identificationDocument.documentType,
          number: traveler.identificationDocument.number,
          expiryDate: traveler.identificationDocument.expiryDate,
          issuingCountry: traveler.identificationDocument.issuingCountry,
          issuingDate: traveler.identificationDocument.issuingDate,
          nationality: traveler.identificationDocument.nationality,
        }
      : undefined,
  }));
}

/**
 * Save booking to database
 */
async function saveBookingToDatabase(
  bookingId: string,
  ticketId: string,
  sequenceNumber: number,
  supplier: "amadeus" | "ebooking",
  request: BookingRequest,
  supplierResponse: any
): Promise<any> {
  // Extract PNR based on supplier
  let pnr = "";
  let supplierBookingId = "";

  if (supplier === "amadeus") {
    pnr = supplierResponse.associatedRecords?.[0]?.reference || "";
    supplierBookingId = supplierResponse.id || "";
  } else {
    pnr = supplierResponse.bookingReference || supplierResponse.pnr || "";
    supplierBookingId = supplierResponse.bookingReference || "";
  }

  // Determine status
  let status = "confirmed";
  if (supplier === "amadeus") {
    const ticketingOption = supplierResponse.ticketingAgreement?.option;
    status = ticketingOption === "CONFIRM" ? "ticketed" : "confirmed";
  } else {
    status = supplierResponse.status || "confirmed";
  }

  // Extract itineraries (simplified - needs proper mapping)
  const itineraries =
    supplier === "amadeus"
      ? supplierResponse.flightOffers?.[0]?.itineraries || []
      : [];

  // Extract passengers
  const passengers = request.travelers.map((t) => ({
    travelerId: t.id || t.reference || "",
    firstName: t.firstName,
    lastName: t.lastName,
    dateOfBirth: t.dateOfBirth || t.birthDate || "",
    gender: t.gender || "MALE",
    email: t.email,
    phoneCountryCode: t.phoneCountryCode || t.phonePrefix,
    phoneNumber: t.phoneNumber || t.phone,
    documentType: t.documentType?.toUpperCase() as any,
    documentNumber: t.documentNumber || t.identificationDocument?.number,
    documentExpiryDate:
      t.documentExpiryDate || t.identificationDocument?.expiryDate,
    documentIssuanceCountry:
      t.documentIssuanceCountry || t.identificationDocument?.issuingCountry,
    documentIssuanceDate:
      t.documentIssuanceDate || t.identificationDocument?.issuingDate,
    nationality: t.nationality || t.identificationDocument?.nationality,
  }));

  // Create booking document
  const booking = new FlightBooking({
    bookingId: bookingId,
    ticketId: ticketId,
    sequenceNumber,
    pnr,
    amadeusBookingId: supplier === "amadeus" ? supplierBookingId : undefined,
    ebookingBookingReference:
      supplier === "ebooking" ? supplierBookingId : undefined,
    supplier,
    status,
    agency: request.agencyId,
    wholesaler: request.wholesalerId,
    subagent: request.subagentId,
    flightType: "ONE_WAY", // Needs proper detection
    itineraries,
    passengers,
    passengerCount: {
      adults: passengers.filter((p) => p.dateOfBirth).length, // Needs proper counting
      children: 0,
      infants: 0,
    },
    contact: request.contactEmail
      ? {
          email: request.contactEmail,
          phone: request.contactPhone || "",
          phoneCountryCode: request.contactPhoneCountryCode || "",
          address: request.address,
        }
      : undefined,
    priceDetails: {
      // Extract from supplier response
      price: {
        value: 0,
        currency: "USD",
      },
    },
    totalPrice: {
      value: 0,
      currency: "USD",
    },
    ticketingAgreement:
      supplier === "amadeus" ? supplierResponse.ticketingAgreement : undefined,
    ticketingDeadline: supplierResponse.ticketingAgreement?.dateTime,
    remarks: request.remarks || request.comments,
    instantTicketing: request.instantTicketing,
    seatSelections: supplier === "amadeus" ? request.seatSelections : undefined,
    flightOfferData: request.flightOffer,
    supplierResponseData: supplierResponse,
    // Store ebooking seat requests in remarks or supplier response
    ...(supplier === "ebooking" && request.seatRequests
      ? {
          remarks: `${
            request.remarks || request.comments || ""
          }\nSeat Requests: ${JSON.stringify(request.seatRequests)}`.trim(),
        }
      : {}),
  });

  await booking.save();
  return booking;
}

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
  // Validate required fields for Amadeus
  if (
    !request.contactEmail ||
    !request.contactPhone ||
    !request.contactPhoneCountryCode
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Contact email, phone, and phone country code are required for Amadeus bookings"
    );
  }

  if (!request.address) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Address is required for Amadeus bookings"
    );
  }

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
async function createAmadeusBooking(request: BookingRequest): Promise<any> {
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

    return response.data.data;
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
}

/**
 * Create flight booking (supports both Amadeus and ebooking)
 * Main entry point for booking creation
 */
export const createFlightBooking = async (
  request: BookingRequest
): Promise<BookingResponse> => {
  // Fetch agency and wholesaler slugs from database
  const { wholesalerSlug, agencySlug } = await getAgencyWholesalerSlugs(
    request.wholesalerId,
    request.agencyId
  );

  // Generate ticket ID with slug support
  // Format: WH-GWT-AG-TES-TKT-00001 (with slugs) or TKT-00000001 (without slugs)
  const { bookingId, ticketId, sequenceNumber } = await generateBookingSlug(
    wholesalerSlug,
    agencySlug
  );

  // Detect supplier
  const supplier =
    request.supplier || (request.availabilityToken ? "ebooking" : "amadeus");

  let supplierResponse: any;

  // Call appropriate supplier API
  if (supplier === "ebooking") {
    // Handle ebooking booking
    const { srk, offerIndex } = extractEbookingBookingParams(request);

    const ebookingRequest: EbookingBookingRequest = {
      clientRef: request.clientRef || bookingId,
      availabilityToken: request.availabilityToken!,
      travelers: transformToEbookingTravelers(request.travelers),
      OSIRemarks: request.OSIRemarks,
      seatRequests: request.seatRequests?.map((s) => ({
        paxReference: s.paxReference!,
        preference: s.preference!,
      })),
      frequentTravellerCards: request.frequentTravellerCards,
      backOfficeRemarks: request.backOfficeRemarks,
      comments: request.comments,
      priceModifiers: request.priceModifiers,
    };

    // TODO: Enable when ready to call ebooking API
    // supplierResponse = await createEbookingBooking(
    //   srk,
    //   offerIndex,
    //   ebookingRequest
    // );

    // For now, prepare the response object with the request data
    supplierResponse = {
      bookingReference: bookingId,
      status: "pending",
      pnr: `PNR-${bookingId}`,
      message: "Booking prepared but not submitted to ebooking API",
      ebookingRequest, // Store the prepared request
      srk,
      offerIndex,
    };
  } else {
    // Handle Amadeus booking
    supplierResponse = await createAmadeusBooking(request);
  }

  // Save booking to database
  const savedBooking = await saveBookingToDatabase(
    bookingId,
    ticketId,
    sequenceNumber,
    supplier,
    request,
    supplierResponse
  );

  // Prepare response
  const ticketingOption =
    supplier === "amadeus"
      ? supplierResponse.ticketingAgreement?.option
      : undefined;
  const isTicketed = supplier === "amadeus" && ticketingOption === "CONFIRM";

  // Extract e-ticket number if available (13 digits)
  const eTicketNumber =
    supplier === "amadeus"
      ? supplierResponse.associatedRecords?.find(
          (record: Record<string, unknown>) =>
            typeof record.reference === "string" &&
            record.reference.length === 13
        )?.reference
      : supplierResponse.ticketNumbers?.[0];

  const bookingResponse: BookingResponse = {
    bookingId: ticketId,
    ticketId: ticketId,
    pnr:
      supplier === "amadeus"
        ? supplierResponse.associatedRecords?.[0]?.reference
        : supplierResponse.bookingReference || supplierResponse.pnr,
    status: isTicketed ? "TICKETED" : savedBooking.status.toUpperCase(),
    supplier,
    createdAt: savedBooking.createdAt.toISOString(),
    ticketingDeadline:
      supplier === "amadeus"
        ? supplierResponse.ticketingAgreement?.dateTime
        : undefined,
    ticketingOption: ticketingOption,
    eTicketNumber: eTicketNumber,
    queuingOfficeId:
      supplier === "amadeus" ? supplierResponse.queuingOfficeId : undefined,
    automatedProcess:
      supplier === "amadeus" ? supplierResponse.automatedProcess : undefined,
    ticketingAgreement:
      supplier === "amadeus" ? supplierResponse.ticketingAgreement : undefined,
    flightOffers:
      supplier === "amadeus" ? supplierResponse.flightOffers : undefined,
    travelers:
      supplier === "amadeus"
        ? supplierResponse.travelers
        : supplierResponse.travelers,
    contacts: supplier === "amadeus" ? supplierResponse.contacts : undefined,
    seatSelections: request.seatSelections || request.seatRequests,
    raw: supplierResponse,
    agency: savedBooking.agency?.toString(),
    wholesaler: savedBooking.wholesaler?.toString(),
    subagent: savedBooking.subagent?.toString(),
  };

  return bookingResponse;
};
