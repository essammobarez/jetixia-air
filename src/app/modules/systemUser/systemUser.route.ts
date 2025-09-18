import express from "express";
import { SystemUserController } from "./systemUser.controller";
import { SystemUserValidation } from "./systemUser.validation";

import { SYSTEM_ROLE } from "./systemUser.constant";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = express.Router();

// Public routes
router.post(
  "/login",
  validateRequest(SystemUserValidation.loginSystemUserZodSchema),
  SystemUserController.loginSystemUser
);

// Protected routes - require authentication
// router.use(auth());

// Routes accessible by all authenticated system users
router.get("/profile", SystemUserController.getSystemUserById);
router.patch(
  "/change-password",
  validateRequest(SystemUserValidation.changePasswordZodSchema),
  SystemUserController.changePassword
);

// Routes accessible by SUPER_ADMIN and ADMIN only
// router.use(auth(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN));

router.post(
  "/",
  validateRequest(SystemUserValidation.createSystemUserZodSchema),
  SystemUserController.createSystemUser
);

router.get("/", SystemUserController.getAllSystemUsers);

router.get("/:id", SystemUserController.getSystemUserById);

router.patch(
  "/:id",
  validateRequest(SystemUserValidation.updateSystemUserZodSchema),
  SystemUserController.updateSystemUser
);

router.delete("/:id", SystemUserController.deleteSystemUser);

// router.patch("/:id/toggle-status", SystemUserController.toggleSystemUserStatus);

export const SystemUserRoutes = router;
