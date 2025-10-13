import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { FlightsRoutes } from "../modules/ebooking-flight/search/searchFlights.route";
import { checkAvailabilityRouter } from "../modules/ebooking-flight/availability/availability.route";
import { FlightsBookRoutes } from "../modules/ebooking-flight/booking/bookFlight.route";
import { airlineRoutes } from "../modules/ebooking-flight/airlines/airline.route";
import { AirportRoutes } from "../modules/airport/airport.route";
import { PriceListRoutes } from "../modules/price-list/priceList.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/ebooking-flight",
    route: [FlightsRoutes, checkAvailabilityRouter, FlightsBookRoutes],
  },
  {
    path: "/airlines",
    route: airlineRoutes,
  },
  {
    path: "/airports",
    route: AirportRoutes,
  },
  {
    path: "/price-list",
    route: PriceListRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
