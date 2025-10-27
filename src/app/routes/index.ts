import express from "express";
// import { AuthRoutes } from "../modules/auth/auth.route";
// import { AuthModelConfigRoutes } from "../modules/auth/authModelConfig.route";
// import { FlightsRoutes } from "../modules/ebooking-flight/search/searchFlights.route";
// import { checkAvailabilityRouter } from "../modules/ebooking-flight/availability/availability.route";
// import { FlightsBookRoutes } from "../modules/ebooking-flight/booking/bookFlight.route";
// import { airlineRoutes } from "../modules/ebooking-flight/airlines/airline.route";
import { AirportRoutes } from "../modules/airport/airport.route";
import { PriceListRoutes } from "../modules/price-list/priceList.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { FlightBookingRoutes } from "../modules/booking/flightBooking.route";
import { BlockSeatRoutes } from "../modules/blockseat/blockSeat.route";
import { SeatMapRoutes } from "../modules/seatmap/seatmap.route";
import { SabreTestRoutes } from "../modules/supplierTest/sabre/sabre-test.route";
import { FlightsRoutes } from "../modules/supplierTest/ebooking-flight/search/searchFlights.route";
import { checkAvailabilityRouter } from "../modules/supplierTest/ebooking-flight/availability/availability.route";
import { FlightsBookRoutes } from "../modules/supplierTest/ebooking-flight/booking/bookFlight.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/ebooking-flight",
    route: [FlightsRoutes, checkAvailabilityRouter, FlightsBookRoutes],
  },
  // {
  //   path: "/airlines",
  //   route: airlineRoutes,
  // },
  {
    path: "/airports",
    route: AirportRoutes,
  },
  {
    path: "/price-list",
    route: PriceListRoutes,
  },
  {
    path: "/seatmap",
    route: SeatMapRoutes,
  },
  {
    path: "/booking",
    route: BookingRoutes,
  },
  {
    path: "/flight-booking",
    route: FlightBookingRoutes,
  },
  {
    path: "/block-seats",
    route: BlockSeatRoutes,
  },
  {
    path: "/sabre-test",
    route: SabreTestRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
