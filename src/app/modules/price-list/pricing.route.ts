import express from "express";
import { PricingController } from "./pricing.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PricingValidation } from "./pricing.validation";

const router = express.Router();

// POST /api/v1/price-list/confirm - Get confirmed pricing with detailed information
router.post(
  "/confirm",
  validateRequest(PricingValidation.flightOfferPricingSchema),
  PricingController.confirmFlightPricing
);

// GET /api/v1/price-list/test - Get test pricing data for development
router.get("/test", PricingController.getTestPricingData);

export const PricingRoutes = router;
