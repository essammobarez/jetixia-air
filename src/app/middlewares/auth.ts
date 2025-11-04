/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/AppError";
import config from "../config";
import { User } from "../modules/user/user.model";
import Subuser from "../modules/subuser/subuser.model";
import { Subadmin } from "../modules/SubAdmin/subAdmin.model";
// import { ISubadmin } from "../modules/SubAdmin/subAdmin.interface";
// import { SubAgent } from "../modules/sub-agency/subAgency.model";

const authWithUserStatus =
  (...requiredRoles: string[]) =>
  async (req: any, res: Response, next: NextFunction) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. JWT Verification
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return reject(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
        }

        const token = authHeader.split(" ")[1];
        const verifiedUser = jwt.verify(
          token,
          config.jwt_access_secret as string
        ) as JwtPayload;

        if (!verifiedUser) {
          return reject(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
        }
        console.log(requiredRoles, "req roles");
        console.log(verifiedUser.role, "verified roles");
        // 2. Role Check
        if (
          requiredRoles.length &&
          !requiredRoles.includes(verifiedUser.role)
        ) {
          return reject(new AppError(httpStatus.FORBIDDEN, "Forbidden"));
        }

        let user: any = null;

        // 3. Try User
        user = await User.findById(verifiedUser.userId).select(
          "isVerified isLocked wholesalerId wholesaler"
        );

        // 4. Try Subuser
        if (!user) {
          user = await Subuser.findById(verifiedUser.userId).select(
            "isVerified isLocked wholesalerId wholesaler"
          );
        }
        // if (!user) {
        //   user = await SubAgent.findById(verifiedUser.userId).select(
        //     "-password"
        //   );
        // }

        // 5. Try Subadmin
        if (!user) {
          const subadmin = await Subadmin.findById(verifiedUser.userId).select(
            "isActive"
          );
          if (!subadmin) {
            return reject(new AppError(httpStatus.NOT_FOUND, "User not found"));
          }

          if (!subadmin.isActive) {
            return reject(
              new AppError(httpStatus.FORBIDDEN, "Account is deactivated")
            );
          }

          // Attach subadmin info
          req.user = {
            userId: verifiedUser.userId,
            role: verifiedUser.role,
          };

          return resolve(true);
        }

        // 6. Check Lock status (for User / Subuser only)
        if (user.isLocked) {
          return reject(
            new AppError(
              httpStatus.FORBIDDEN,
              "Account locked. Contact support."
            )
          );
        }

        // Attach minimal user data
        req.user = {
          userId: verifiedUser.userId,
          agencyId: verifiedUser.agencyId,
          role: verifiedUser.role,
          wholesalerId: verifiedUser.wholesalerId,
        };

        resolve(true);
      } catch (error) {
        reject(
          error instanceof AppError
            ? error
            : new AppError(httpStatus.UNAUTHORIZED, "Unauthorized")
        );
      }
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default authWithUserStatus;