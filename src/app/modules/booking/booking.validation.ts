import { z } from "zod";

const createFlightBookingSchema = z.object({
  body: z.object({
    supplier: z.enum(["amadeus", "ebooking"]).optional(),

    // Flight offer (for Amadeus)
    flightOffer: z.any().optional(),

    // Travelers
    travelers: z
      .array(
        z.object({
          // Common fields
          id: z.string().optional(), // For Amadeus
          reference: z.string().optional(), // For ebooking (e.g., "1-1")
          firstName: z
            .string({
              required_error: "First name is required",
            })
            .min(1, "First name cannot be empty")
            .max(56, "First name must be 56 characters or less"),
          lastName: z
            .string({
              required_error: "Last name is required",
            })
            .min(1, "Last name cannot be empty")
            .max(56, "Last name must be 56 characters or less"),

          // Date of birth (supports both formats)
          dateOfBirth: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          birthDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),

          // Type and gender
          gender: z.enum(["MALE", "FEMALE"]).optional(), // For Amadeus
          type: z.enum(["adult", "child", "infant"]).optional(), // For ebooking
          ptc: z.string().optional(), // For ebooking (ADT, CHD, INF)
          lead: z.boolean().optional(), // For ebooking
          title: z.string().optional(), // For ebooking (mr, mrs, ms)

          // Contact
          email: z.string().email().optional(),
          phoneCountryCode: z.string().optional(),
          phoneNumber: z.string().optional(),
          phonePrefix: z.string().optional(), // For ebooking
          phone: z.string().optional(), // For ebooking

          // Documents (supports both formats)
          documentType: z.string().optional(),
          documentNumber: z.string().optional(),
          documentExpiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          documentIssuanceCountry: z.string().optional(),
          documentIssuanceDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          nationality: z.string().optional(),
          associatedAdultId: z.string().optional(),

          // ebooking nested document format
          identificationDocument: z
            .object({
              documentType: z.string(),
              number: z.string(),
              expiryDate: z.string(),
              issuingCountry: z.string(),
              issuingDate: z.string().optional(),
              nationality: z.string(),
            })
            .optional(),
        })
      )
      .min(1, "At least one traveler is required")
      .max(9, "Maximum 9 travelers allowed"),

    // Contact information (optional for ebooking if in travelers)
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactPhoneCountryCode: z.string().optional(),

    // Address (optional for ebooking)
    address: z
      .object({
        lines: z.array(z.string()).min(1),
        postalCode: z.string(),
        cityName: z.string(),
        countryCode: z.string().length(2),
      })
      .optional(),

    remarks: z.string().optional(),
    instantTicketing: z.boolean().optional(),

    // Amadeus seat selections
    seatSelections: z
      .array(
        z.object({
          segmentId: z.string().optional(),
          travelerIds: z.array(z.string()).optional(),
          number: z.string().optional(),
        })
      )
      .optional(),

    // ebooking specific fields
    clientRef: z.string().optional(),
    availabilityToken: z.string().optional(),
    srk: z.string().optional(),
    offerIndex: z.string().optional(),

    OSIRemarks: z
      .array(
        z.object({
          airlineCode: z.string(),
          text: z.string(),
        })
      )
      .optional(),

    seatRequests: z
      .array(
        z.object({
          paxReference: z.string(),
          preference: z.string(),
        })
      )
      .optional(),

    frequentTravellerCards: z
      .array(
        z.object({
          paxReference: z.string(),
          airlineCode: z.string(),
          number: z.string(),
          expiryDate: z.string().optional(),
          issuingDate: z.string().optional(),
        })
      )
      .optional(),

    backOfficeRemarks: z
      .array(
        z.object({
          id: z.number(),
          text: z.string(),
        })
      )
      .optional(),

    comments: z.string().optional(),

    priceModifiers: z
      .object({
        markup: z
          .object({
            value: z.number(),
            currency: z.string(),
          })
          .optional(),
        commission: z
          .object({
            value: z.number(),
            currency: z.string(),
          })
          .optional(),
      })
      .optional(),

    // Auth context (for testing without middleware)
    wholesalerId: z.string().optional(),
    agencyId: z.string().optional(),
    subagentId: z.string().optional(),
  }),
});

export const BookingValidation = {
  createFlightBookingSchema,
};
