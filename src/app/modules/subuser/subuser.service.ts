import {
  ISubuser,
  IAssignPermissionsRequest,
  IPermissionResponse,
  MENU_ITEMS,
  PERMISSION_TYPES,
} from "./subuser.interface";
import Subuser from "./subuser.model";
import { User } from "../user/user.model";

import httpStatus from "http-status";
import AppError from "../../errors/AppError";

// Create subuser
const createSubuser = async (payload: ISubuser): Promise<ISubuser> => {
  // Check if email already exists in subuser collection
  const existingSubuser = await Subuser.findOne({ email: payload.email });
  if (existingSubuser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Email already exists in subuser collection"
    );
  }

  // Check if email already exists in user collection
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Email already exists in user collection"
    );
  }

  const result = await Subuser.create(payload);
  return result;
};

// Get all subusers
const getAllSubusers = async (): Promise<ISubuser[]> => {
  const result = await Subuser.find({}).select("-password");
  return result;
};

// Get single subuser
const getSingleSubuser = async (id: string): Promise<ISubuser | null> => {
  const result = await Subuser.findById(id).select("-password");
  return result;
};

// Update subuser
const updateSubuser = async (
  id: string,
  payload: Partial<ISubuser>
): Promise<ISubuser | null> => {
  const isExist = await Subuser.findById(id);

  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Subuser not found !");
  }

  // If email is being updated, check for uniqueness across both collections
  if (payload.email && payload.email !== isExist.email) {
    // Check if new email already exists in subuser collection (excluding current subuser)
    const existingSubuser = await Subuser.findOne({
      email: payload.email,
      _id: { $ne: id },
    });
    if (existingSubuser) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Email already exists in subuser collection"
      );
    }

    // Check if new email already exists in user collection
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Email already exists in user collection"
      );
    }
  }

  const result = await Subuser.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

// Delete subuser
const deleteSubuser = async (id: string): Promise<ISubuser | null> => {
  const isExist = await Subuser.findById(id);

  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Subuser not found !");
  }

  const result = await Subuser.findByIdAndDelete(id);
  return result;
};

// Assign permissions to subuser
const assignPermissions = async (
  payload: IAssignPermissionsRequest
): Promise<IPermissionResponse> => {
  const { subuserId, permissions } = payload;

  // Check if subuser exists
  const subuser = await Subuser.findById(subuserId);
  if (!subuser) {
    throw new AppError(httpStatus.NOT_FOUND, "Subuser not found!");
  }

  // Validate permissions format
  const validPermissions = permissions.every((permission) => {
    const [menu, action] = permission.split(":");
    return (
      menu &&
      action &&
      MENU_ITEMS.includes(menu as (typeof MENU_ITEMS)[number]) &&
      PERMISSION_TYPES.includes(action as (typeof PERMISSION_TYPES)[number])
    );
  });

  if (!validPermissions) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid permission format. Use "MenuName:Permission" where MenuName is one of the available menus and Permission is Read or Write'
    );
  }

  // Update subuser permissions
  subuser.permissions = permissions;
  await subuser.save();

  return {
    subuserId,
    permissions: subuser.permissions,
    updatedAt: new Date(),
  };
};

// Get subuser permissions
const getSubuserPermissions = async (subuserId: string): Promise<string[]> => {
  const subuser = await Subuser.findById(subuserId).select("permissions");
  if (!subuser) {
    throw new AppError(httpStatus.NOT_FOUND, "Subuser not found!");
  }
  return subuser.permissions;
};

// Get available menu items for permissions
const getAvailableMenuItems = async (): Promise<
  { menu: string; permissions: string[] }[]
> => {
  return MENU_ITEMS.map((menu) => ({
    menu,
    permissions: [...PERMISSION_TYPES],
  }));
};

// Check if subuser has specific permission
const hasPermission = async (
  subuserId: string,
  requiredPermission: string
): Promise<boolean> => {
  const subuser = await Subuser.findById(subuserId).select("permissions");
  if (!subuser) {
    return false;
  }
  return subuser.permissions.includes(requiredPermission);
};

const getSubusersByWholesalerService = async (wholesalerId: string) => {
  const subusers = await Subuser.find({ wholesaler: wholesalerId });

  if (!subusers || subusers.length === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No subusers found for this wholesaler"
    );
  }

  return subusers;
};

export const SubuserService = {
  createSubuser,
  getAllSubusers,
  getSingleSubuser,
  updateSubuser,
  deleteSubuser,
  assignPermissions,
  getSubuserPermissions,
  getAvailableMenuItems,
  hasPermission,
  getSubusersByWholesalerService,
};
