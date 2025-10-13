import express from "express";
import { PriceListController } from "./priceList.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PriceListValidation } from "./priceList.validation";
import { PricingRoutes } from "./pricing.route";

const router = express.Router();

// POST /api/v1/price-list - Get flight offers with price list
router.post(
  "/",
  validateRequest(PriceListValidation.flightOfferQuerySchema),
  PriceListController.getFlightOffers
);

// Pricing confirmation routes
router.use(PricingRoutes);

export const PriceListRoutes = router;
