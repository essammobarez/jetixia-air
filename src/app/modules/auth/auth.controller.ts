/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unsafe-optional-chaining */
import httpStatus from "http-status";
import config from "../../config";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";


const loginAdminUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginAdminUser(req.body);
  const { refreshToken, accessToken, adminUser } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin user logged in successfully!",
    data: {
      ...adminUser,
      token: accessToken,
    },
  });
});

export const AuthController = {
  loginAdminUser,
};
