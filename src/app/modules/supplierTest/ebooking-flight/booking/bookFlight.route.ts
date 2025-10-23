import express from "express";
import { bookFlight } from "./bookFlight.controller";

const router = express.Router();


router.post("/book", bookFlight);

export const FlightsBookRoutes = router;
