import express from "express";
import { FlightsController } from "./searchFlights.controller";

const router = express.Router();

router.post("/search", FlightsController.fetchFlights);

export const FlightsRoutes = router;
