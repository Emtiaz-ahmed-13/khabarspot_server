import { z } from "zod";

const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email("Invalid email"),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  email: z.string({ required_error: "Email is required" }).email("Invalid email"),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
});

export const AuthValidation = {
  loginSchema,
  registerSchema,
};

