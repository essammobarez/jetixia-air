import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import {
  createSubAgent,
  getSubAgentsByAgency,
  updateSubAgent,
  toggleSubAgentStatus,
  deleteSubAgent,
  getBookingsForUser,
  clearAllSubAgentPermissions,
  getSubAgentPermissions,
  assignPermissionsToSubAgent,
  getAllPermissionsService,
  togglePermissionForSubAgent,
  getSubAgentDetails,
} from "./subAgency.service";

export const createSubAgentController = catchAsync(
  async (req: any, res: Response) => {
    const agencyId = req.user?.agencyId || req.body.agencyId;
    if (!agencyId) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: "agencyId is required" });
    }

    const result = await createSubAgent(req.user, agencyId, req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Sub-agent created successfully",
      data: result,
    });
  }
);

export const getSubAgentDetailsController = catchAsync(async (req, res) => {
  const { subAgentId } = req.params;
  const details = await getSubAgentDetails(subAgentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sub-agent details fetched successfully",
    data: details,
  });
});

export const getSubAgentsController = catchAsync(
  async (req: any, res: Response) => {
    const agencyId = req.user?.agencyId || req.query.agencyId;
    if (!agencyId) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: "agencyId is required" });
    }

    const subAgents = await getSubAgentsByAgency(req.user, agencyId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sub-agents fetched successfully",
      data: subAgents,
    });
  }
);

export const updateSubAgentController = catchAsync(
  async (req: any, res: Response) => {
    const subAgentId = req.params.id;
    const agencyId = req.user?.agencyId || req.body.agencyId;

    const result = await updateSubAgent(
      req.user,
      subAgentId,
      req.body,
      agencyId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sub-agent updated successfully",
      data: result,
    });
  }
);

export const toggleSubAgentStatusController = catchAsync(
  async (req: any, res: Response) => {
    const subAgentId = req.params.id;
    const agencyId = req.user?.agencyId || req.body.agencyId;
    const { status } = req.body;

    const result = await toggleSubAgentStatus(
      req.user,
      subAgentId,
      status,
      agencyId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Sub-agent status updated to ${status}`,
      data: result,
    });
  }
);

export const deleteSubAgentController = catchAsync(
  async (req: any, res: Response) => {
    const subAgentId = req.params.id;
    const agencyId = req.user?.agencyId || req.body.agencyId;

    await deleteSubAgent(req.user, subAgentId, agencyId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sub-agent deleted successfully",
      data: null,
    });
  }
);

export const getBookingsSubagentController = catchAsync(
  async (req: any, res: Response) => {
    const subAgentId = req.query.subAgentId || undefined;
    const agencyId = req.query.agencyId || undefined;
    const bookings = await getBookingsForUser(req.user, subAgentId, agencyId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookings fetched successfully",
      data: { total: bookings.length, bookings },
    });
  }
);

export const getAllPermissionsController = catchAsync(
  async (req: Request, res: Response) => {
    const permissions = await getAllPermissionsService();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All permissions fetched successfully",
      data: permissions,
    });
  }
);

export const assignPermissionsController = catchAsync(
  async (req: Request, res: Response) => {
    const { subAgentId } = req.params;
    const { permission } = req.body;

    const updated = await assignPermissionsToSubAgent(subAgentId, permission);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Role ${permission} assigned successfully`,
      data: updated,
    });
  }
);

export const getPermissionsController = catchAsync(
  async (req: Request, res: Response) => {
    const { subAgentId } = req.params;
    const permissions = await getSubAgentPermissions(subAgentId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permissions fetched successfully",
      data: { subAgentId, permissions },
    });
  }
);

// export const removePermissionsController = catchAsync(
//   async (req: Request, res: Response) => {
//     const { subAgentId } = req.params;
//     const { permissions } = req.body;

//     const updated = await removeSubAgentPermissions(subAgentId, permissions);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Selected permissions removed",
//       data: updated,
//     });
//   }
// );

export const togglePermissionController = catchAsync(async (req, res) => {
  const { subAgentId } = req.params;
  const { permission, enable } = req.body;

  const permissions = await togglePermissionForSubAgent(
    subAgentId,
    permission,
    enable
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Permission ${enable ? "enabled" : "disabled"} successfully`,
    data: permissions,
  });
});

export const clearPermissionsController = catchAsync(
  async (req: Request, res: Response) => {
    const { subAgentId } = req.params;

    const updated = await clearAllSubAgentPermissions(subAgentId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All permissions cleared",
      data: updated,
    });
  }
);
