import express from "express";
import { PriceListController } from "./priceList.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PriceListValidation } from "./priceList.validation";
import { PricingRoutes } from "./pricing.route";

const router = express.Router();

// POST /api/v1/price-list - Get flight offers with price list (multi-supplier)
router.post(
  "/",
  validateRequest(PriceListValidation.flightOfferQuerySchema),
  PriceListController.getFlightOffers
);

// POST /api/v1/price-list/amadeus - Get flight offers from Amadeus only (legacy)
router.post(
  "/amadeus",
  validateRequest(PriceListValidation.flightOfferQuerySchema),
  PriceListController.getAmadeusFlightOffers
);

// GET /api/v1/price-list/suppliers - Get supplier information and status
router.get("/suppliers", PriceListController.getSupplierStatus);

// Pricing confirmation routes
router.use(PricingRoutes);

export const PriceListRoutes = router;
