import { Schema, model } from "mongoose";
import { TSystemUser, SystemUserModel } from "./systemUser.interface";
import { SYSTEM_ROLE } from "./systemUser.constant";
import * as bcrypt from "bcrypt";

const systemUserSchema = new Schema<TSystemUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        // Generate a unique userId with timestamp and random string
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `sys_${timestamp}_${randomStr}`;
      },
    },
    hashedUserId: {
      type: String,
      required: false, // Make it optional in schema, we'll set it in pre-save
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    role: {
      type: String,
      enum: Object.values(SYSTEM_ROLE),
      default: "STAFF",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to check if system user exists by userId
systemUserSchema.statics.isSystemUserExist = async function (userId: string) {
  // Find user by comparing the provided userId with hashedUserId
  const allUsers = await SystemUser.find({}).select("+password");

  for (const user of allUsers) {
    if (user.hashedUserId) {
      // Add null check
      const isMatch = await bcrypt.compare(userId, user.hashedUserId);
      if (isMatch) {
        return user;
      }
    }
  }

  return null;
};

// Static method to check if system user exists by email
systemUserSchema.statics.isSystemUserExistByEmail = async function (
  email: string
) {
  return await SystemUser.findOne({ email }).select("+password");
};

// Static method to check password
systemUserSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};

// Pre-save middleware to hash password and userId
systemUserSchema.pre("save", async function (next) {
  try {
    // Hash password if it's being modified
    if (this.isModified("password")) {
      const hashedPassword = await bcrypt.hash(this.password, 12);
      this.password = hashedPassword;
    }

    // Always ensure hashedUserId is set
    if (!this.hashedUserId) {
      const hashedUserId = await bcrypt.hash(this.userId, 12);
      this.hashedUserId = hashedUserId;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export const SystemUser = model<TSystemUser, SystemUserModel>(
  "SystemUser",
  systemUserSchema
);
