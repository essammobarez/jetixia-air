import { Router } from "express";
import { BlockSeatController } from "./blockSeat.controller";
import authWithUserStatus from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";

const router = Router();

// ==================== BLOCK SEAT ROUTES ====================

/**
 * @route   POST /api/v1/block-seats
 * @desc    Create a new block seat inventory
 * @access  Private (Wholesaler)
 * @body    {
 *   name: string,
 *   airline: { code: string, name: string, country?: string },
 *   route: { from: { country: string, iataCode: string }, to: { country: string, iataCode: string }, tripType: "ONE_WAY" | "ROUND_TRIP" },
 *   availableDates: Array<{ departureDate: string, returnDate?: string }>, // For ONE_WAY: only departureDate, For ROUND_TRIP: both departureDate and returnDate
 *   classes: Array<{ classId: number, className?: string, totalSeats: number, price: number }>,
 *   currency?: string, // default "USD"
 *   status?: "Available" | "Unavailable", // default "Available"
 *   fareRules?: { template?: string, refundable?: boolean, changeFee?: number, cancellationFee?: number },
 *   baggageAllowance?: { checkedBags?: number, weightPerBag?: string, carryOnWeight?: string },
 *   commission?: { supplierCommission?: { type: string, value: number }, agencyCommission?: { type: string, value: number } },
 *   remarks?: string
 * }
 */
router.post(
  "/",
  authWithUserStatus(USER_ROLE.whole_saler, USER_ROLE.MODERATOR),
  BlockSeatController.createBlockSeat
);

/**
 * @route   GET /api/v1/block-seats
 * @desc    Get all block seats for authenticated wholesaler
 * @access  Private (Wholesaler)
 * @query   page?: number, limit?: number
 */
router.get(
  "/",
  authWithUserStatus(USER_ROLE.whole_saler, USER_ROLE.MODERATOR),
  BlockSeatController.getBlockSeats
);

/**
 * @route   GET /api/v1/block-seats/:id
 * @desc    Get specific block seat by ID for authenticated wholesaler
 * @access  Private (Wholesaler)
 * @params  id: string (blockSeatId)
 */
router.get(
  "/:id",
  authWithUserStatus(USER_ROLE.whole_saler, USER_ROLE.MODERATOR),
  BlockSeatController.getBlockSeatById
);

export const BlockSeatRoutes = router;
