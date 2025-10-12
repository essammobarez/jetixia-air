import express from "express";
import { AirportController } from "./airport.controller";

const router = express.Router();

// Search airports by name and municipality
router.get("/search", AirportController.searchAirports);

// Get all airports with pagination
router.get("/", AirportController.getAllAirports);

// Get airport by ID
router.get("/:id", AirportController.getAirportById);

export const AirportRoutes = router;
