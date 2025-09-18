import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

// Define JWT payload interface based on AdminUser model
export interface JwtPayloadData {
  userId: Types.ObjectId; // MongoDB ObjectId
  adminUserId?: string; // Admin user's userId (e.g., "admin001")
  email: string; // User's email
  role: string; // User's role
  isActive?: boolean; // Account status
  lastLogin?: Date; // Last login timestamp
}

export const createToken = (
  jwtPayload: JwtPayloadData,
  secret: string,
  expiresIn: string
) => {
  const options: SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(jwtPayload, secret, options);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
