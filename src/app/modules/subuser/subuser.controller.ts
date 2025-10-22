import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SubuserService } from "./subuser.service";
import { ISubuser, IAssignPermissionsRequest } from "./subuser.interface";
import httpStatus from "http-status";

// Create subuser
const createSubuser = catchAsync(async (req: Request, res: Response) => {
  const { ...subuserData } = req.body;
  const result = await SubuserService.createSubuser(subuserData);

  sendResponse<ISubuser>(res, {
    statusCode: 200,
    success: true,
    message: "Subuser created successfully",
    data: result,
  });
});

// Get all subusers
const getAllSubusers = catchAsync(async (req: Request, res: Response) => {
  const result = await SubuserService.getAllSubusers();

  sendResponse<ISubuser[]>(res, {
    statusCode: 200,
    success: true,
    message: "Subusers retrieved successfully",
    data: result,
  });
});

// Get single subuser
const getSingleSubuser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubuserService.getSingleSubuser(id);

  sendResponse<ISubuser>(res, {
    statusCode: 200,
    success: true,
    message: "Subuser retrieved successfully",
    data: result,
  });
});

// Update subuser
const updateSubuser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await SubuserService.updateSubuser(id, updatedData);

  sendResponse<ISubuser>(res, {
    statusCode: 200,
    success: true,
    message: "Subuser updated successfully",
    data: result,
  });
});

// Delete subuser
const deleteSubuser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubuserService.deleteSubuser(id);

  sendResponse<ISubuser>(res, {
    statusCode: 200,
    success: true,
    message: "Subuser deleted successfully",
    data: result,
  });
});

// Assign permissions to subuser
const assignPermissions = catchAsync(async (req: Request, res: Response) => {
  const payload: IAssignPermissionsRequest = req.body;
  const result = await SubuserService.assignPermissions(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permissions assigned successfully",
    data: result,
  });
});

// Get subuser permissions
const getSubuserPermissions = catchAsync(
  async (req: Request, res: Response) => {
    const { subuserId } = req.params;
    const result = await SubuserService.getSubuserPermissions(subuserId);

    sendResponse<string[]>(res, {
      statusCode: 200,
      success: true,
      message: "Subuser permissions retrieved successfully",
      data: result,
    });
  }
);

// Get available menu items for permissions
const getAvailableMenuItems = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubuserService.getAvailableMenuItems();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Available menu items retrieved successfully",
      data: result,
    });
  }
);

// Remove specific permissions from subuser
const removePermissions = catchAsync(async (req: Request, res: Response) => {
  const { subuserId } = req.params;
  const { permissionsToRemove } = req.body; // Array of permissions to remove

  // Get current permissions
  const currentPermissions = await SubuserService.getSubuserPermissions(
    subuserId
  );

  // Remove specified permissions
  const updatedPermissions = currentPermissions.filter(
    (permission) => !permissionsToRemove.includes(permission)
  );

  // Assign updated permissions
  const result = await SubuserService.assignPermissions({
    subuserId,
    permissions: updatedPermissions,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permissions removed successfully",
    data: result,
  });
});

// Clear all permissions from subuser
const clearAllPermissions = catchAsync(async (req: Request, res: Response) => {
  const { subuserId } = req.params;

  const result = await SubuserService.assignPermissions({
    subuserId,
    permissions: [],
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All permissions cleared successfully",
    data: result,
  });
});

const getSubusersByWholesaler = catchAsync(
  async (req: Request, res: Response) => {
    const wholesalerId = req.params.wholesalerId;

    const result = await SubuserService.getSubusersByWholesalerService(
      wholesalerId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subusers fetched successfully",
      data: result,
    });
  }
);

export const SubuserController = {
  createSubuser,
  getAllSubusers,
  getSingleSubuser,
  updateSubuser,
  deleteSubuser,
  assignPermissions,
  getSubuserPermissions,
  getAvailableMenuItems,
  removePermissions,
  clearAllPermissions,
  getSubusersByWholesaler,
};
