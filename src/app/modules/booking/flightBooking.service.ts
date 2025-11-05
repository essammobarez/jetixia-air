import { FlightBooking } from "./flightBooking.model";
import { BookingRequest, BookingResponse } from "./booking.interface";
import { createFlightBooking as callAmadeusAPI } from "./booking.service";
import { generateFlightBookingSlug } from "./flightBooking.utils";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

/**
 * Create flight booking - Call Amadeus API and save to database
 */
export const createAndSaveFlightBooking = async (
  request: BookingRequest,
  agencyId: string,
  agencySlug: string,
  wholesalerId: string,
  wholesalerSlug: string,
  subagentId?: string,
  mainBookingId?: string
) => {
  try {
    // Step 1: Call Amadeus API to create booking
    const amadeusResponse: BookingResponse = await callAmadeusAPI(request);

    // Step 2: Validate response
    if (!amadeusResponse.flightOffers || amadeusResponse.flightOffers.length === 0) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Invalid booking response: No flight offers returned"
      );
    }

    const flightOffer = amadeusResponse.flightOffers[0];

    // Step 3: Generate flight booking ID with agency/wholesaler slugs
    const { flightBookingId, sequenceNumber } = await generateFlightBookingSlug(
      wholesalerSlug,
      agencySlug
    );

    // Step 4: Determine flight type
    let flightType = "ONE_WAY";
    if (flightOffer.itineraries.length === 2) {
      flightType = "ROUND_TRIP";
    } else if (flightOffer.itineraries.length > 2) {
      flightType = "MULTI_CITY";
    }

    // Extract pricing
    const price = flightOffer.price;
    const totalPrice = {
      value: parseFloat(price.total),
      currency: price.currency,
    };

    // Count passengers by type
    const passengerCount = {
      adults: 0,
      children: 0,
      infants: 0,
    };

    request.travelers.forEach((traveler) => {
      const birthDate = new Date(traveler.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      if (traveler.associatedAdultId) {
        passengerCount.infants++;
      } else if (age < 12) {
        passengerCount.children++;
      } else {
        passengerCount.adults++;
      }
    });

    // Step 4: Create flight booking document
    const flightBooking = await FlightBooking.create({
      // Identifiers
      flightBookingId,
      sequenceNumber,

      // Amadeus references
      pnr: amadeusResponse.pnr,
      amadeusBookingId: amadeusResponse.bookingId,

      // Link to main booking (optional)
      mainBooking: mainBookingId || null,
      mainBookingId: mainBookingId || null,
      isStandalone: !mainBookingId,

      // Flight details
      flightType,
      itineraries: flightOffer.itineraries,

      // Passengers
      passengers: request.travelers.map((t) => ({
        travelerId: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        dateOfBirth: t.dateOfBirth,
        gender: t.gender,
        email: t.email,
        phoneCountryCode: t.phoneCountryCode,
        phoneNumber: t.phoneNumber,
        documentType: t.documentType,
        documentNumber: t.documentNumber,
        documentExpiryDate: t.documentExpiryDate,
        documentIssuanceCountry: t.documentIssuanceCountry,
        documentIssuanceDate: t.documentIssuanceDate,
        nationality: t.nationality,
        birthPlace: t.birthPlace,
        issuanceLocation: t.issuanceLocation,
        associatedAdultId: t.associatedAdultId,
      })),
      passengerCount,

      // Contact
      contact: {
        email: request.contactEmail,
        phone: request.contactPhone,
        phoneCountryCode: request.contactPhoneCountryCode,
        address: request.address,
      },

      // Pricing
      priceDetails: {
        price: totalPrice,
        originalPrice: totalPrice,
        baseFare: {
          value: parseFloat(price.base || price.total),
          currency: price.currency,
        },
        taxes: {
          value:
            parseFloat(price.total) - parseFloat(price.base || price.total),
          currency: price.currency,
        },
      },
      totalPrice,

      // Ticketing
      ticketingAgreement: amadeusResponse.ticketingAgreement || {
        option: request.instantTicketing ? "CONFIRM" : "DELAY_TO_CANCEL",
        delay: request.instantTicketing ? undefined : "6D",
        dateTime: amadeusResponse.ticketingDeadline
          ? new Date(amadeusResponse.ticketingDeadline)
          : undefined,
      },
      ticketingDeadline: amadeusResponse.ticketingDeadline
        ? new Date(amadeusResponse.ticketingDeadline)
        : undefined,
      ticketNumbers: amadeusResponse.eTicketNumber
        ? [amadeusResponse.eTicketNumber]
        : [],
      instantTicketing: request.instantTicketing || false,

      // Optional services
      seatSelections: request.seatSelections || [],
      baggageAllowance: {}, // Can be populated from flight offer if needed

      // Status
      status: amadeusResponse.status === "TICKETED" ? "ticketed" : "confirmed",

      // Agency references
      agency: agencyId,
      wholesaler: wholesalerId,
      subagent: subagentId || null,

      // Additional info
      remarks: request.remarks,
      queuingOfficeId: amadeusResponse.queuingOfficeId,
      automatedProcess: amadeusResponse.automatedProcess || [],

      // Raw data storage
      flightOfferData: request.flightOffer,
      amadeusResponseData: {
        bookingId: amadeusResponse.bookingId,
        pnr: amadeusResponse.pnr,
        status: amadeusResponse.status,
        createdAt: amadeusResponse.createdAt,
        ticketingDeadline: amadeusResponse.ticketingDeadline,
        ticketingOption: amadeusResponse.ticketingOption,
        eTicketNumber: amadeusResponse.eTicketNumber,
        flightOffers: amadeusResponse.flightOffers,
        travelers: amadeusResponse.travelers,
        contacts: amadeusResponse.contacts,
      },

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      flightBooking: {
        _id: flightBooking._id,
        flightBookingId: flightBooking.flightBookingId,
        pnr: flightBooking.pnr,
        amadeusBookingId: flightBooking.amadeusBookingId,
        status: flightBooking.status,
        flightType: flightBooking.flightType,
        origin: flightBooking.getOrigin(),
        destination: flightBooking.getDestination(),
        departureDate: flightBooking.getFirstDepartureDate(),
        arrivalDate: flightBooking.getLastArrivalDate(),
        passengerCount: flightBooking.passengerCount,
        totalPrice: flightBooking.totalPrice,
        ticketingDeadline: flightBooking.ticketingDeadline,
        ticketNumbers: flightBooking.ticketNumbers,
        createdAt: flightBooking.createdAt,
      },
      amadeusResponse,
    };
  } catch (error) {
    // Error creating flight booking
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to create and save flight booking"
    );
  }
};

/**
 * Get flight booking by ID
 */
export const getFlightBookingById = async (flightBookingId: string) => {
  const flightBooking = await FlightBooking.findOne({ flightBookingId })
    .populate("agency", "name email")
    .populate("wholesaler", "name email")
    .populate("subagent", "name email")
    .lean();

  if (!flightBooking) {
    throw new AppError(httpStatus.NOT_FOUND, "Flight booking not found");
  }

  return flightBooking;
};

/**
 * Get all flight bookings for an agency
 */
export const getFlightBookingsByAgency = async (
  agencyId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    FlightBooking.find({ agency: agencyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("wholesaler", "name")
      .lean(),
    FlightBooking.countDocuments({ agency: agencyId }),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
