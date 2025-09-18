/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
// import { User } from "../user/user.model";
import { SystemUser } from "../systemUser/systemUser.model";
import { TLoginUser, TLoginAdminUser } from "./auth.interface";
import { createToken } from "./auth.utils";
import config from "../../config";
// import { TUser } from "../user/user.interface";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import emailSender from "./sendMail";
import * as bcrypt from "bcrypt";

const loginAdminUser = async (payload: TLoginAdminUser) => {
  const { userId, password } = payload;

  const systemUser = await SystemUser.isSystemUserExist(userId);

  if (!systemUser) {
    throw new AppError(httpStatus.NOT_FOUND, "System user does not exist");
  }

  if (!systemUser.isActive) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "System user account is deactivated"
    );
  }

  const isCorrectPassword = await SystemUser.isPasswordMatched(
    password,
    systemUser.password
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  // Update last login
  await SystemUser.findByIdAndUpdate(systemUser._id, {
    lastLogin: new Date(),
  });

  const jwtPayload = {
    userId: systemUser._id,
    adminUserId: systemUser.userId,
    email: systemUser.email,
    role: systemUser?.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    adminUser: {
      _id: systemUser._id,
      userId: systemUser.userId,
      email: systemUser.email,
      role: systemUser?.role,
      isActive: systemUser.isActive,
      lastLogin: systemUser.lastLogin,
      createdAt: systemUser.createdAt,
      updatedAt: systemUser.updatedAt,
    },
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  loginAdminUser,
};
