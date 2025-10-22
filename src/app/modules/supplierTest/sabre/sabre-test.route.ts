import express from "express";
import { SabreController } from "./sabre.controller";

const router = express.Router();

/**
 * Sabre API Routes
 */

// Authentication & Connection Tests
router.get("/auth", SabreController.testAuth);
router.get("/connection", SabreController.testConnection);

// Flight Search API
router.post("/flights/search", SabreController.searchFlights);

// Location APIs
router.get("/countries", SabreController.getSupportedCountries);
router.get("/cities/:countryCode", SabreController.getCitiesByCountry);

export const SabreTestRoutes = router;

