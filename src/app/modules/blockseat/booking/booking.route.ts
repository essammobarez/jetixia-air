import { Router } from "express";
import authWithUserStatus from "../../../middlewares/auth";
import { USER_ROLE } from "../../user/user.constant";
import { BlockSeatBookingController } from "./booking.controller";

const router = Router();

// Get all bookings by wholesaler
router.get(
  "/",
  authWithUserStatus(USER_ROLE.whole_saler, USER_ROLE.MODERATOR),
  BlockSeatBookingController.getBookingsByWholesaler
);

// Create booking (Agency/Subuser/SubAdmin allowed depending on roles)
router.post(
  "/",
  authWithUserStatus(
    USER_ROLE.whole_saler,
    USER_ROLE.MODERATOR,
    USER_ROLE.agency_admin
  ),
  BlockSeatBookingController.createBooking
);

// Get booking by id
router.get(
  "/:id",
  authWithUserStatus(
    USER_ROLE.whole_saler,
    USER_ROLE.MODERATOR,
    USER_ROLE.agency_admin
  ),
  BlockSeatBookingController.getBooking
);

// Update booking status (confirm/cancel)
router.patch(
  "/:id/status",
  authWithUserStatus(
    USER_ROLE.whole_saler,
    USER_ROLE.MODERATOR,
    USER_ROLE.agency_admin
  ),
  BlockSeatBookingController.updateStatus
);

export const BlockSeatBookingRoutes = router;
