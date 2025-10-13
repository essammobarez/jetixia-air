import { z } from "zod";

const flightOfferQuerySchema = z.object({
  body: z.object({
    originLocationCode: z
      .string({
        required_error: "Origin location code is required",
      })
      .length(3, "Origin location code must be 3 characters (IATA code)")
      .toUpperCase(),

    destinationLocationCode: z
      .string({
        required_error: "Destination location code is required",
      })
      .length(3, "Destination location code must be 3 characters (IATA code)")
      .toUpperCase(),

    departureDate: z
      .string({
        required_error: "Departure date is required",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Departure date must be in YYYY-MM-DD format"
      ),

    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Return date must be in YYYY-MM-DD format")
      .optional(),

    adults: z
      .number({
        required_error: "Number of adults is required",
      })
      .int()
      .min(1, "At least 1 adult is required")
      .max(9, "Maximum 9 adults allowed"),

    children: z
      .number()
      .int()
      .min(0, "Children cannot be negative")
      .max(9, "Maximum 9 children allowed")
      .optional(),

    infants: z
      .number()
      .int()
      .min(0, "Infants cannot be negative")
      .max(9, "Maximum 9 infants allowed")
      .optional(),

    travelClass: z
      .enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"], {
        errorMap: () => ({
          message:
            "Travel class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST",
        }),
      })
      .optional(),

    nonStop: z.boolean().optional(),

    max: z
      .number()
      .int()
      .min(1, "Max must be at least 1")
      .max(250, "Max cannot exceed 250")
      .optional(),
  }),
});

export const PriceListValidation = {
  flightOfferQuerySchema,
};
