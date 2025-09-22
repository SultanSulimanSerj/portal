import { z } from 'zod';

// Registration DTO
export const registerDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyName: z.string().min(1).max(255).optional(),
  companySubdomain: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .optional(),
});

// Login DTO
export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Refresh Token DTO
export const refreshTokenDtoSchema = z.object({
  refreshToken: z.string().optional(),
});

// Change Password DTO
export const changePasswordDtoSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// Forgot Password DTO
export const forgotPasswordDtoSchema = z.object({
  email: z.string().email(),
});

// Reset Password DTO
export const resetPasswordDtoSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// Auth Response DTO
export const authResponseDtoSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
  }),
  company: z.object({
    id: z.string().uuid(),
    name: z.string(),
    subdomain: z.string(),
  }),
  membership: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'PM', 'WORKER', 'VIEWER']),
    joinedAt: z.date().nullable(),
  }),
  tokens: z.object({
    accessToken: z.string(),
    expiresIn: z.number(),
  }),
});

// Export types
export type RegisterDto = z.infer<typeof registerDtoSchema>;
export type LoginDto = z.infer<typeof loginDtoSchema>; 
export type RefreshTokenDto = z.infer<typeof refreshTokenDtoSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordDtoSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDtoSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDtoSchema>;
export type AuthResponseDto = z.infer<typeof authResponseDtoSchema>;