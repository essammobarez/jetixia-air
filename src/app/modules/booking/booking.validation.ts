import { z } from "zod";

const createFlightBookingSchema = z.object({
  body: z.object({
    flightOffer: z.any({
      required_error: "Flight offer is required",
    }),

    travelers: z
      .array(
        z.object({
          id: z.string({
            required_error: "Traveler ID is required",
          }),

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

          dateOfBirth: z
            .string({
              required_error: "Date of birth is required",
            })
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "Date of birth must be in YYYY-MM-DD format"
            ),

          gender: z.enum(["MALE", "FEMALE"], {
            errorMap: () => ({
              message: "Gender is required and must be MALE or FEMALE",
            }),
          }),

          email: z.string().email().optional(),
          phoneCountryCode: z.string().optional(),
          phoneNumber: z.string().optional(),

          documentType: z.enum(["PASSPORT", "IDENTITY_CARD"]).optional(),
          documentNumber: z.string().optional(),
          documentExpiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          documentIssuanceCountry: z.string().optional(),
          nationality: z.string().optional(),
          associatedAdultId: z.string().optional(),
        })
      )
      .min(1, "At least one traveler is required")
      .max(9, "Maximum 9 travelers allowed"),

    contactEmail: z.string().email({
      message: "Valid contact email is required",
    }),

    contactPhone: z.string({
      required_error: "Contact phone is required",
    }),

    contactPhoneCountryCode: z.string({
      required_error: "Contact phone country code is required",
    }),

    address: z.object({
      lines: z
        .array(z.string())
        .min(1, "At least one address line is required"),
      postalCode: z.string({
        required_error: "Postal code is required",
      }),
      cityName: z.string({
        required_error: "City name is required",
      }),
      countryCode: z
        .string({
          required_error: "Country code is required",
        })
        .length(2, "Country code must be 2 characters (ISO code)"),
    }),

    remarks: z.string().optional(),

    instantTicketing: z.boolean().optional(),

    seatSelections: z
      .array(
        z.object({
          segmentId: z.string({
            required_error: "Segment ID is required for seat selection",
          }),
          travelerIds: z
            .array(z.string())
            .min(1, "At least one traveler ID is required for seat selection"),
          number: z
            .string({
              required_error: "Seat number is required",
            })
            .regex(
              /^[0-9]{1,3}[A-K]$/,
              "Seat number must be in format like 12A, 15F"
            ),
        })
      )
      .optional(),
  }),
});

export const BookingValidation = {
  createFlightBookingSchema,
};
