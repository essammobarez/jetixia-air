import { z } from "zod";

const getSeatMapSchema = z.object({
  body: z.object({
    supplier: z.enum(["amadeus", "ebooking"]).optional(),
    flightOffers: z.array(z.any()).optional(),
    // ebooking fields
    srk: z.string().optional(),
    offerIndex: z.string().optional(),
    token: z.string().optional(),
    availabilityToken: z.string().optional(),
    segmentReference: z.string().optional(),
  }),
});

export const SeatMapValidation = {
  getSeatMapSchema,
};
