/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/AppError";
import config from "../config";

const auth =
  (...requiredRoles: string[]) =>
  async (req: any, res: Response, next: NextFunction) => {
    return new Promise(async (resolve, reject) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reject(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
      }

      // Extract the token part after "Bearer "
      const token = authHeader.split(" ")[1];

      try {
        const verifiedUser = jwt.verify(
          token,
          config.jwt_access_secret as string
        ) as JwtPayload;

        if (!verifiedUser) {
          return reject(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
        }

        req.user = verifiedUser;

        if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
          return reject(new AppError(httpStatus.FORBIDDEN, "Forbidden"));
        }

        resolve(verifiedUser);
      } catch (error) {
        return reject(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
      }
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
