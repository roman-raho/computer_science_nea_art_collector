import { z } from "zod";

export const loginDetailsSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long") // minimum length 8
    .regex(
      // at least one number and one special character
      /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Password must contain at least one number and one special character"
    ),
});

export const passwordChangeSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long") // minimum length 8
  .regex(
    /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
    "Password must contain at least one number and one special character"
  );

export const emailSchema = z.email();

export type LoginDetails = z.infer<typeof loginDetailsSchema>; // export type for use in other files
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type Email = z.infer<typeof emailSchema>;
