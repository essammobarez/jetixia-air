import { ISubadmin } from "./subAdmin.interface";
import { Subadmin } from "./subAdmin.model";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import bcrypt from 'bcrypt';


const createSubadmin = async (payload: ISubadmin): Promise<ISubadmin> => {
  const hashedPassword = await bcrypt.hash(payload.password, 12); 
  payload.password = hashedPassword;

  const result = await Subadmin.create(payload);
  return result;
};


// Get all subadmins
const getAllSubadmins = async (): Promise<ISubadmin[]> => {
  return Subadmin.find({}).select("-password");
};

// Get single subadmin
const getSingleSubadmin = async (id: string): Promise<ISubadmin | null> => {
  const result = await Subadmin.findById(id).select("-password");
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Subadmin not found");
  }
  return result;
};

// Update subadmin
const updateSubadmin = async (
  id: string,
  payload: Partial<ISubadmin>
): Promise<ISubadmin | null> => {
  const result = await Subadmin.findByIdAndUpdate(id, payload, { new: true }).select("-password");
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Subadmin not found");
  }
  return result;
};

// Delete subadmin
const deleteSubadmin = async (id: string): Promise<ISubadmin | null> => {
  const result = await Subadmin.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Subadmin not found");
  }
  return result;
};

export const SubadminService = {
  createSubadmin,
  getAllSubadmins,
  getSingleSubadmin,
  updateSubadmin,
  deleteSubadmin,
};
