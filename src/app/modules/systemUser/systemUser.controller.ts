import { Request, Response } from "express";

import { SystemUserServices } from "./systemUser.service";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";

const createSystemUser = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemUserServices.createSystemUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "System user created successfully",
    data: result,
  });
});

const getAllSystemUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemUserServices.getAllSystemUsers();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System users retrieved successfully",
    data: result,
  });
});

const getSystemUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SystemUserServices.getSystemUserById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System user retrieved successfully",
    data: result,
  });
});

const updateSystemUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SystemUserServices.updateSystemUser(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System user updated successfully",
    data: result,
  });
});

const deleteSystemUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SystemUserServices.deleteSystemUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System user deleted successfully",
    data: result,
  });
});

const loginSystemUser = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemUserServices.loginSystemUser(req.body);

  res.cookie("refreshToken", result.refreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System user logged in successfully",
    data: {
      ...result.systemUser,
      token: result.accessToken,
    },
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SystemUserServices.changePassword(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

export const SystemUserController = {
  createSystemUser,
  getAllSystemUsers,
  getSystemUserById,
  updateSystemUser,
  deleteSystemUser,
  loginSystemUser,
  changePassword,
};
