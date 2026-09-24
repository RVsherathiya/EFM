import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).trim(),
  code: z.string().min(2).max(10).trim().toUpperCase(),
  headId: z.string().optional().nullable(),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).trim().optional(),
  headId: z.string().optional().nullable(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
