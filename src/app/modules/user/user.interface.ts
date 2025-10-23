/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";

// Define the subscription object type
export interface TSubscription {
  isActive: boolean;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  currentPlan: string | null; // e.g., "Basic", "Pro"
  planInterval: string | null; // e.g., "month", "year"
  subscriptionStart: Date | null;
  subscriptionEnd: Date | null;
  autoRenew: boolean;
}

// Main user interface
export interface TUser {
  toObject(): { [x: string]: any; password: any };
  _id: Types.ObjectId;
  username: string;
  email: string;
  role:
    | "admin"
    | "user"
    | "agency_admin"
    | "whole_saler"
    | "sub_agent"
    | "sales";
  password: string;
  phone: string;
  address: string;
  commissionRate: number;
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
  subscription: TSubscription;
  agency: Types.ObjectId;
  wholesaler: Types.ObjectId;
  isVerified: boolean;
  isLocked: boolean;
  webAuth: boolean;
  googleAuth: boolean;
  secretKey: string;  
}

// User model with static methods
export interface UserModel extends Model<TUser> {
  isUserExist(email: string): Promise<TUser | null>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof USER_ROLE;
