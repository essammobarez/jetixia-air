import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SubadminService } from "./subAdmin.service";
import { ISubadmin } from "./subAdmin.interface";
import httpStatus from "http-status";

// Create Subadmin
const createSubadmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubadminService.createSubadmin(req.body);
  sendResponse<ISubadmin>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subadmin created successfully",
    data: result,
  });
});

// Get all Subadmins
const getAllSubadmins = catchAsync(async (_req: Request, res: Response) => {
  const result = await SubadminService.getAllSubadmins();
  sendResponse<ISubadmin[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subadmins retrieved successfully",
    data: result,
  });
});

// Get single Subadmin
const getSingleSubadmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubadminService.getSingleSubadmin(req.params.id);
  sendResponse<ISubadmin>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subadmin retrieved successfully",
    data: result,
  });
});

// Update Subadmin
const updateSubadmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubadminService.updateSubadmin(req.params.id, req.body);
  sendResponse<ISubadmin>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subadmin updated successfully",
    data: result,
  });
});

// Delete Subadmin
const deleteSubadmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubadminService.deleteSubadmin(req.params.id);
  sendResponse<ISubadmin>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subadmin deleted successfully",
    data: result,
  });
});

export const SubadminController = {
  createSubadmin,
  getAllSubadmins,
  getSingleSubadmin,
  updateSubadmin,
  deleteSubadmin,
};
