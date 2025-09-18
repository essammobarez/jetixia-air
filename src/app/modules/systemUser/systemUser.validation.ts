import { z } from "zod";
import { SYSTEM_ROLE } from "./systemUser.constant";

const createSystemUserZodSchema = z.object({
  body: z.object({
    userId: z.string().optional(), // Auto-generated, so optional
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters"),
    role: z
      .enum(Object.values(SYSTEM_ROLE) as [string, ...string[]])
      .optional(), // Optional, defaults to "STAFF"
    isActive: z.boolean().optional(),
  }),
});

const updateSystemUserZodSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    role: z
      .enum(Object.values(SYSTEM_ROLE) as [string, ...string[]])
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

const loginSystemUserZodSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }),
    password: z.string({
      required_error: "Password is required",
    }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: "Old password is required",
    }),
    newPassword: z
      .string({
        required_error: "New password is required",
      })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const SystemUserValidation = {
  createSystemUserZodSchema,
  updateSystemUserZodSchema,
  loginSystemUserZodSchema,
  changePasswordZodSchema,
};
