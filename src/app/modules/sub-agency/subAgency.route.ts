import express from "express";
import {
  createSubAgentController,
  getSubAgentsController,
  updateSubAgentController,
  toggleSubAgentStatusController,
  deleteSubAgentController,
  getBookingsSubagentController,
  clearPermissionsController,
  getPermissionsController,
  assignPermissionsController,
  getAllPermissionsController,
  togglePermissionController,
  getSubAgentDetailsController,
} from "../sub-agency/subAgency.controller";
import authWithUserStatus from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import validateRequest from "../../middlewares/validateRequest";
import { SubAgentValidation } from "../sub-agency/subAgency.validation";
import { upload } from "../../middlewares/upload";

const router = express.Router();

router.post(
  "/create",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.whole_saler),
  validateRequest(SubAgentValidation.createSubAgentValidation),
  createSubAgentController
);

router.get(
  "/list",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.whole_saler),
  getSubAgentsController
);

router.patch(
  "/update/:id",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.whole_saler),
  validateRequest(SubAgentValidation.updateSubAgentValidation),
  updateSubAgentController
);

router.patch(
  "/status/:id",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.whole_saler),
  validateRequest(SubAgentValidation.toggleStatusValidation),
  toggleSubAgentStatusController
);

router.get(
  "/:subAgentId/details",
  authWithUserStatus(
    USER_ROLE.agency_admin,
    USER_ROLE.whole_saler,
    USER_ROLE.sub_agent
  ),
  getSubAgentDetailsController
);

router.delete(
  "/delete/:id",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.whole_saler),
  deleteSubAgentController
);

router.get(
  "/bookings",
  authWithUserStatus(
    USER_ROLE.sub_agent,
    USER_ROLE.agency_admin,
    USER_ROLE.whole_saler
  ),
  getBookingsSubagentController
);

router.get(
  "/permissions/all",
  authWithUserStatus(USER_ROLE.agency_admin),
  getAllPermissionsController
);

router.post(
  "/:subAgentId/permissions",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.MODERATOR),
  assignPermissionsController
);

router.get(
  "/:subAgentId/permissions",
  authWithUserStatus(USER_ROLE.agency_admin, USER_ROLE.sub_agent),
  getPermissionsController
);

// router.delete(
//   "/:subAgentId/permissions/remove",
//   authWithUserStatus(USER_ROLE.agency_admin),
//   removePermissionsController
// );

router.patch(
  "/:subAgentId/permissions/toggle",
  authWithUserStatus(USER_ROLE.agency_admin),
  togglePermissionController
);

router.delete(
  "/:subAgentId/permissions",
  authWithUserStatus(USER_ROLE.agency_admin),
  clearPermissionsController
);

export const SubAgentRoutes = router;
