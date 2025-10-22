import { Router } from "express";
import { FlightsAvailabilityController } from "./avalbility.controller";

const router = Router();

router.get(
  "/offer-prices",
  FlightsAvailabilityController.checkAvailability
);

export const checkAvailabilityRouter= router;
