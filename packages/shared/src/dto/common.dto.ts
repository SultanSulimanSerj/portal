import { z } from 'zod';

// Pagination DTO
export const paginationDtoSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search DTO  
export const searchDtoSchema = z.object({
  query: z.string().min(1).max(255),
});

// ID Param DTO
export const idParamDtoSchema = z.object({
  id: z.string().uuid(),
});

// Success Response DTO
export const successResponseDtoSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
});

// Error Response DTO
export const errorResponseDtoSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

// Export types
export type PaginationDto = z.infer<typeof paginationDtoSchema>;
export type SearchDto = z.infer<typeof searchDtoSchema>;
export type IdParamDto = z.infer<typeof idParamDtoSchema>;
export type SuccessResponseDto = z.infer<typeof successResponseDtoSchema>;
export type ErrorResponseDto = z.infer<typeof errorResponseDtoSchema>;