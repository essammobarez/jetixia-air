import config from "../../config";
import AppError from "../../errors/AppError";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { TUser } from "./user.interface";
import { UserServices } from "./user.service";
import httpStatus from "http-status";

const createUser = catchAsync(async (req, res) => {
  const userData = req.body;

  const result = await UserServices.createUser(userData);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, "User registration failed");
  }
  const { user, accessToken, refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: {
      ...user,
      token: accessToken,
    },
  });
});

export const UserController = {
  createUser,
};
