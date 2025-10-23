import mongoose from "mongoose";
import { SubAgent } from "../sub-agency/subAgency.model";
import { User } from "../user/user.model";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { USER_ROLE } from "../user/user.constant";
import { Agency } from "../agency/agency.model";
import emailSender from "../auth/sendMail";
import { verifyAgencyAndSubAgentOwnership } from "./utils/verifyAgencyAndSubAgentOwnership";
import { Booking } from "../irix/Booking/booking.model";
import { SUBAGENT_PERMISSIONS } from "../sub-agency/constants/permissions.constant";
import { Buffer } from "buffer";

export const createSubAgent = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  agencyId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    profileImage?: string;
  }
) => {
  await verifyAgencyAndSubAgentOwnership(currentUser, agencyId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const agency = await Agency.findById(agencyId).session(session);
    if (!agency) throw new AppError(httpStatus.NOT_FOUND, "Agency not found");

    const emailExists = await User.findOne({ email: data.email }).session(
      session
    );
    if (emailExists)
      throw new AppError(httpStatus.CONFLICT, "Email already exists");

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // const username = `${data.firstName.toLowerCase()} ${data.lastName.toLowerCase()}`;

    const subAgentData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone: string;
      agency: string;
      profileImage?: {
        data: Buffer;
        contentType: string;
      } | null;
      permissions: string[];
    } = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone || "",
      agency: agencyId,
      profileImage: null,
      permissions: ["supervisor"], // Default permission
    };

    if (data.profileImage && data.profileImage.includes(";base64,")) {
      const [meta, base64String] = data.profileImage.split(";base64,");
      subAgentData.profileImage = {
        data: Buffer.from(base64String, "base64"),
        contentType: meta.split(":")[1],
      };
    } else if (data.profileImage) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid image format");
    }
    // console.log("Image Length:", data.profileImage.length);

    const subAgent = await SubAgent.create([subAgentData], { session });

    // const user = await User.create(
    //   [
    //     {
    //       username,
    //       email: data.email,
    //       password: hashedPassword,
    //       role: USER_ROLE.sub_agent,
    //       phone: data.phone,
    //       agency: agencyId,
    //       profileImage: subAgentData?.profileImage || null,
    //     },
    //   ],
    //   { session }
    // );

    await session.commitTransaction();

    const emailContent = `
      <div>
        <h2>Welcome to Jetixia, ${data.firstName}</h2>
        <p>Your sub-agent account under agency <strong>${agency.agencyName}</strong> has been created.</p>
        <p>Login details:</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Password:</strong> ${data.password}</p>
        <p><a href="https://www.bdesktravel.com/login">Login to Dashboard</a></p>
      </div>
    `;
    await emailSender(
      data.email,
      emailContent,
      "Your SubAgent Account is Ready"
    );

    return { subAgent: subAgent[0] };
  } catch (error: unknown) {
    await session.abortTransaction();
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, errorMessage);
  } finally {
    session.endSession();
  }
};

export const getSubAgentsByAgency = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  agencyId: string
) => {
  await verifyAgencyAndSubAgentOwnership(currentUser, agencyId);
  return await SubAgent.find({ agency: agencyId });
};

export const updateSubAgent = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  subAgentId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    profileImage?: string; // Base64
  }>,
  agencyId: string
) => {
  await verifyAgencyAndSubAgentOwnership(currentUser, agencyId, subAgentId);

  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "SubAgent not found");

  const user = await User.findOne({
    email: subAgent.email,
    role: USER_ROLE.sub_agent,
  });
  if (!user)
    throw new AppError(httpStatus.NOT_FOUND, "User for SubAgent not found");

  if (data.firstName) {
    subAgent.firstName = data.firstName;
  }
  if (data.lastName) {
    subAgent.lastName = data.lastName;
  }

  if (data.firstName || data.lastName) {
    const newUsername = `${data.firstName || subAgent.firstName} ${
      data.lastName || subAgent.lastName
    }`.toLowerCase();
    user.username = newUsername;
  }

  if (data.email) {
    subAgent.email = data.email;
    user.email = data.email;
  }

  if (data.phone) {
    subAgent.phone = data.phone;
    user.phone = data.phone;
  }

  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    subAgent.password = hashedPassword;
    user.password = hashedPassword;
  }

  if (data.profileImage !== undefined) {
    if (data.profileImage === null || data.profileImage === "") {
      subAgent.profileImage = undefined;
      user.profileImage = undefined;
    } else {
      const base64Data = data.profileImage.split(";base64,").pop();
      const profileImage = {
        data: Buffer.from(base64Data!, "base64"),
        contentType: data.profileImage.split(";")[0].split(":")[1],
      };
      subAgent.profileImage = profileImage;
      user.profileImage = profileImage;
    }
  }

  await subAgent.save();
  console.log("About to save user...");
  await user.save();
  console.log("User saved!");

  return await SubAgent.findById(subAgentId);
};

export const toggleSubAgentStatus = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  subAgentId: string,
  status: "active" | "inactive",
  agencyId: string
) => {
  await verifyAgencyAndSubAgentOwnership(currentUser, agencyId, subAgentId);

  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "SubAgent not found");

  subAgent.status = status;
  await subAgent.save();
  return subAgent;
};

export const getSubAgentDetails = async (subAgentId: string) => {
  const subAgent = await SubAgent.findById(subAgentId).populate(
    "agency",
    "agencyName email"
  );
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");
  return subAgent;
};

export const deleteSubAgent = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  subAgentId: string,
  agencyId: string
) => {
  await verifyAgencyAndSubAgentOwnership(currentUser, agencyId, subAgentId);

  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "SubAgent not found");
  await User.deleteOne({ email: subAgent.email });
  await subAgent.deleteOne();
  return subAgent;
};

export const getBookingsForUser = async (
  currentUser: {
    userId: string;
    role: string;
    agencyId?: string;
    wholesalerId?: string;
  },
  subAgentId?: string,
  agencyId?: string
) => {
  const query: Record<string, string | undefined> = {};

  if (currentUser.role === "sub_agent") {
    query.subagent = currentUser.userId;
  } else if (currentUser.role === "agency_admin") {
    query.agency = currentUser.agencyId;

    if (subAgentId) {
      const subAgentExists = await SubAgent.findOne({
        _id: subAgentId,
        agency: currentUser.agencyId,
      });
      if (!subAgentExists) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Subagent not found in this agency"
        );
      }

      const linkedUser = await User.findOne({ email: subAgentExists.email });
      if (!linkedUser) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Linked User not found for this subagent"
        );
      }

      query.subagent = linkedUser._id.toString();
    }
  } else if (currentUser.role === "whole_saler") {
    query.wholesaler = currentUser.wholesalerId;

    if (agencyId) {
      query.agency = agencyId;
    }

    if (subAgentId) {
      const subAgentExists = await SubAgent.findOne({ _id: subAgentId });
      if (!subAgentExists) {
        throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");
      }

      const linkedUser = await User.findOne({ email: subAgentExists.email });
      if (!linkedUser) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Linked User not found for this subagent"
        );
      }

      query.subagent = linkedUser._id.toString();
    }
  } else {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view bookings"
    );
  }

  return await Booking.find(query)
    .populate("agency", "agencyName email")
    .populate("wholesaler", "name email")
    .populate("subagent", "username email");
};

export const getAllPermissionsService = async () => {
  return SUBAGENT_PERMISSIONS;
};

export const assignPermissionsToSubAgent = async (
  subAgentId: string,
  permission: string
) => {
  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");
  console.log(permission);
  // Validate that the permission exists in the allowed permissions
  if (!SUBAGENT_PERMISSIONS.includes(permission)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid permission provided");
  }

  // Assign only one permission at a time
  subAgent.permissions = [permission];
  await subAgent.save();

  // Return only selected fields
  return await SubAgent.findById(subAgentId).select(
    "email permissions"
  );
};

export const getSubAgentPermissions = async (subAgentId: string) => {
  const subAgent = await SubAgent.findById(subAgentId).select("permissions");
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");
  return subAgent.permissions;
};

// export const removeSubAgentPermissions = async (
//   subAgentId: string,
//   permissions: string[]
// ) => {
//   const subAgent = await SubAgent.findById(subAgentId);
//   if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");

//   subAgent.permissions = subAgent.permissions.filter(
//     (perm) => !permissions.includes(perm)
//   );
//   await subAgent.save();
//   return subAgent;
// };

export const togglePermissionForSubAgent = async (
  subAgentId: string,
  permission: string,
  enable: boolean
) => {
  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");

  if (enable) {
    if (
      !permission ||
      typeof permission !== "string" ||
      permission.trim() === "" ||
      permission === "null"
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Permission must be a valid non-null string"
      );
    }

    // Validate permission exists
    if (!SUBAGENT_PERMISSIONS.includes(permission)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid permission provided");
    }

    // Replace current permission with new one (only one permission allowed)
    subAgent.permissions = [permission];
  } else {
    // If disabling, set to default supervisor permission
    subAgent.permissions = ["supervisor"];
  }

  await subAgent.save();
  return subAgent.permissions;
};

export const clearAllSubAgentPermissions = async (subAgentId: string) => {
  const subAgent = await SubAgent.findById(subAgentId);
  if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "Subagent not found");

  // Set to default supervisor permission instead of empty array
  subAgent.permissions = ["supervisor"];
  await subAgent.save();
  return subAgent;
};
