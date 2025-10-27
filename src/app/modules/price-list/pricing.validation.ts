import { z } from "zod";

const flightOfferPricingSchema = z.object({
  body: z.object({
    supplier: z.enum(["amadeus", "ebooking"]).optional(),
    flightOffers: z.array(z.any()).optional(),
    // ebooking fields
    srk: z.string().optional(),
    offerIndex: z.string().optional(),
    itineraryIndex: z.number().optional(),
    token: z.string().optional(),
  }),
});

export const PricingValidation = {
  flightOfferPricingSchema,
};
