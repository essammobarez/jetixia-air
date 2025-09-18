import express from "express";
import validateRequest from "../../middlewares/validateRequest";

import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";

import auth from "../../middlewares/auth";

const router = express.Router();


router.post(
  "/system-login",
  validateRequest(AuthValidation.adminLoginValidationSchema),
  AuthController.loginAdminUser
);





export const AuthRoutes = router;
