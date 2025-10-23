import { z } from "zod";

const createUserZodSchema = z.object({
  body: z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
};
