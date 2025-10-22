import { z } from "zod";

const createSubAgentValidation = z.object({
  body: z.object({
    agencyId: z.string().length(24, "Invalid agencyId format").optional(),
    firstName: z
      .string({ required_error: "First name is required" })
      .min(1, "First name cannot be empty"),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(1, "Last name cannot be empty"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address")
      .min(1, "Email cannot be empty"),
    // role: z.string(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password cannot be empty"),
    phone: z
      .string()
      .regex(/^[0-9]{8,15}$/, "Phone must be 8 to 15 digits")
      .optional(),
  }),
});

const updateSubAgentValidation = z.object({
  body: z.object({
    agencyId: z.string().length(24, "Invalid agencyId format").optional(),
    firstName: z.string().min(1, "First name cannot be empty").optional(),
    lastName: z.string().min(1, "Last name cannot be empty").optional(),
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email cannot be empty")
      .optional(),
    password: z.string().min(1, "Password cannot be empty").optional(),
    phone: z
      .string()
      .regex(/^[0-9]{8,15}$/, "Phone must be 8 to 15 digits")
      .optional(),
  }),
});

const toggleStatusValidation = z.object({
  body: z.object({
    agencyId: z.string().length(24, "Invalid agencyId format").optional(),
    status: z.enum(["active", "inactive"], {
      required_error: "Status is required and must be 'active' or 'inactive'",
    }),
  }),
});

export const SubAgentValidation = {
  createSubAgentValidation,
  updateSubAgentValidation,
  toggleStatusValidation,
};
