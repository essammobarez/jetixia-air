import { z } from "zod";

const issueTicketSchema = z.object({
  params: z.object({
    bookingId: z.string({
      required_error: "Booking ID is required",
    }),
  }),
});

export const TicketingValidation = {
  issueTicketSchema,
};
