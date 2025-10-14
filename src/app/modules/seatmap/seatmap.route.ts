import express from "express";
import { SeatMapController } from "./seatmap.controller";
import validateRequest from "../../middlewares/validateRequest";
import { SeatMapValidation } from "./seatmap.validation";

const router = express.Router();

// POST /api/v1/seatmap - Get seat maps for flight offers
router.post(
  "/",
  validateRequest(SeatMapValidation.getSeatMapSchema),
  SeatMapController.fetchSeatMaps
);

export const SeatMapRoutes = router;
