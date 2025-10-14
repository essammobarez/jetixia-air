import { z } from "zod";

const getSeatMapSchema = z.object({
  body: z.object({
    flightOffers: z
      .array(z.any(), {
        required_error: "Flight offers array is required",
      })
      .min(1, "At least one flight offer is required")
      .max(6, "Maximum 6 flight offers allowed"),
  }),
});

export const SeatMapValidation = {
  getSeatMapSchema,
};
