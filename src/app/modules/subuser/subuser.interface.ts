import { Model, Types } from "mongoose";

export type ISubuser = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  password: string;
  permissions: string[]; // Array of permissions in format "MenuName:Permission"
  wholesaler: Types.ObjectId;
  webAuth: boolean;
  googleAuth: boolean;
  secretKey: string;  
};

export type SubuserModel = Model<ISubuser, Record<string, unknown>>;

// Available menu items for permissions
export const MENU_ITEMS = [
  "Dashboard",
  "Booking",
  "Customers",
  "Markup",
  "Supplier",
  "Sales Person",
  "Payment",
  "Support Tickets",
  "Reports",
] as const;

export type MenuItem = (typeof MENU_ITEMS)[number];

// Permission types
export const PERMISSION_TYPES = ["Read", "Write"] as const;
export type PermissionType = (typeof PERMISSION_TYPES)[number];

// Interface for permission assignment request
export interface IAssignPermissionsRequest {
  subuserId: string;
  permissions: string[]; // Array of "MenuName:Permission" strings
}

// Interface for permission response
export interface IPermissionResponse {
  subuserId: string;
  permissions: string[];
  updatedAt: Date;
}
