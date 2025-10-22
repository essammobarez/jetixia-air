import express from "express";
import { SubuserController } from "./subuser.controller";

const router = express.Router();

// Basic CRUD routes
router.post("/", SubuserController.createSubuser);
router.get("/", SubuserController.getAllSubusers);
router.get("/:id", SubuserController.getSingleSubuser);
router.patch("/:id", SubuserController.updateSubuser);
router.delete("/:id", SubuserController.deleteSubuser);

// Permission management routes
router.post("/assign-permissions", SubuserController.assignPermissions);
router.get("/:subuserId/permissions", SubuserController.getSubuserPermissions);
router.get(
  "/by-wholesaler/:wholesalerId",
  SubuserController.getSubusersByWholesaler
);

router.get("/available-menu-items", SubuserController.getAvailableMenuItems);
router.delete(
  "/:subuserId/remove-permissions",
  SubuserController.removePermissions
);
router.delete(
  "/:subuserId/clear-permissions",
  SubuserController.clearAllPermissions
);

export const SubuserRoutes = router;
