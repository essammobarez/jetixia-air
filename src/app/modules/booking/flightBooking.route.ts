import express from "express";
import { FlightBookingController } from "./flightBooking.controller";
import validateRequest from "../../middlewares/validateRequest";
import { BookingValidation } from "./booking.validation";
import { USER_ROLE } from "../user/user.constant";
import authWithUserStatus from "../../middlewares/auth";

const router = express.Router();

/**
 * Create flight booking
 * POST /api/v1/flight-booking/create
 */
router.post(
  "/create",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.MODERATOR),
  validateRequest(BookingValidation.createFlightBookingSchema),
  FlightBookingController.createFlightBooking
);

/**
 * Get flight booking by ID
 * GET /api/v1/flight-booking/:id
 */
router.get("/:id", FlightBookingController.getFlightBooking);

/**
 * Get all flight bookings for an agency
 * GET /api/v1/flight-booking/agency/:agencyId
 */
router.get(
  "/agency/:agencyId",
  FlightBookingController.getAgencyFlightBookings
);

export const FlightBookingRoutes = router;
