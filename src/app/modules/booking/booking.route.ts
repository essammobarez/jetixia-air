import express from "express";
import { BookingController } from "./booking.controller";
import { TicketingController } from "./ticketing.controller";
import validateRequest from "../../middlewares/validateRequest";
import { BookingValidation } from "./booking.validation";
import { TicketingValidation } from "./ticketing.validation";

const router = express.Router();

// POST /api/v1/booking/create - Create flight booking
router.post(
  "/create",
  validateRequest(BookingValidation.createFlightBookingSchema),
  BookingController.createBooking
);

// POST /api/v1/booking/:bookingId/issue-ticket - Issue ticket for delayed booking
router.post(
  "/:bookingId/issue-ticket",
  validateRequest(TicketingValidation.issueTicketSchema),
  TicketingController.issueFlightTicket
);

export const BookingRoutes = router;
