import { Model, Types } from "mongoose";
import { SYSTEM_ROLE } from "./systemUser.constant";

export interface TSystemUser {
  _id: Types.ObjectId;
  userId: string; // Readable userId for login (e.g., "sys_abc123_def456")
  hashedUserId?: string; // Hashed version for security (optional in interface, set in pre-save)
  email: string;
  password: string;
  role: keyof typeof SYSTEM_ROLE; // Required field with default "STAFF"
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating system users (with optional role)
export interface TCreateSystemUser {
  email: string;
  password: string;
  role?: keyof typeof SYSTEM_ROLE; // Optional during creation
  isActive?: boolean;
}

export interface SystemUserModel extends Model<TSystemUser> {
  // Instance methods for checking if the system user exists
  isSystemUserExist(userId: string): Promise<TSystemUser>;
  isSystemUserExistByEmail(email: string): Promise<TSystemUser>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string
  ): Promise<boolean>;
}

export type TSystemUserRole = keyof typeof SYSTEM_ROLE;
