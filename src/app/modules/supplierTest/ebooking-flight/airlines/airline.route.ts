import { Router } from "express";
import { searchAirlinesController } from "./airline.controller";

const router = Router();
router.get("/search", searchAirlinesController);
export const airlineRoutes=router;
