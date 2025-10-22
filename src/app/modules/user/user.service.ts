/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import AppError from "../../errors/AppError";
import { createToken } from "../auth/auth.utils";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import config from "../../config";

import * as bcrypt from "bcrypt";
const createUser = async (user: TUser): Promise<{ user: TUser; accessToken: string; refreshToken: string } | null> => {
  const hashedPassword: string = await bcrypt.hash(user.password, 12);
  const userData = {
    username: user.username,
    email: user.email,
    password: hashedPassword
  };

  const createdUser = await User.create(userData);

  if (!createdUser) {
    throw new AppError(400, "Failed to create user!");
  }

  const jwtPayload = {
    userId: createdUser._id,
    name: createdUser.username,
    email: createdUser.email,
    role: createdUser.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    String(config.jwt_access_expires_in || "")
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in?.toString() || ""
  );

  const { password, ...userWithoutPassword } = createdUser.toObject();

  return {
    user: userWithoutPassword as unknown as TUser,
    accessToken,
    refreshToken,
  };
};

export const UserServices = { createUser };