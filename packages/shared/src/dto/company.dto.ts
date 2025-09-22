import { z } from 'zod';

// Create Company DTO
export const createCompanyDtoSchema = z.object({
  name: z.string().min(1).max(255),
  subdomain: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
  taxId: z.string().max(50).optional(),
});

// Update Company DTO
export const updateCompanyDtoSchema = createCompanyDtoSchema.partial();

// Invite Member DTO
export const inviteMemberDtoSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'PM', 'WORKER', 'VIEWER']),
});

// Update Member Role DTO
export const updateMemberRoleDtoSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'PM', 'WORKER', 'VIEWER']),
});

// Company Response DTO
export const companyResponseDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subdomain: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  taxId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Member Response DTO
export const memberResponseDtoSchema = z.object({
  id: z.string().uuid(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  role: z.enum(['OWNER', 'ADMIN', 'PM', 'WORKER', 'VIEWER']),
  joinedAt: z.date().nullable(),
  invitedAt: z.date().nullable(),
});

// Export types
export type CreateCompanyDto = z.infer<typeof createCompanyDtoSchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanyDtoSchema>;
export type InviteMemberDto = z.infer<typeof inviteMemberDtoSchema>;
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleDtoSchema>;
export type CompanyResponseDto = z.infer<typeof companyResponseDtoSchema>;
export type MemberResponseDto = z.infer<typeof memberResponseDtoSchema>;