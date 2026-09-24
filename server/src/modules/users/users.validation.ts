import { z } from 'zod';
import { USER_ROLES } from '../../config/constants.js';

export const createUserSchema = z.object({
  employeeCode: z.string().min(2).max(20).trim().toUpperCase(),
  email: z.string().email('Invalid email').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  designation: z.string().min(1).trim(),
  level: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']).default('L1'),
  departmentId: z.string().optional(),
  managerId: z.string().optional().nullable(),
  roles: z.array(z.nativeEnum(USER_ROLES)).min(1, 'At least one role required'),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  designation: z.string().min(1).trim().optional(),
  level: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']).optional(),
  departmentId: z.string().optional().nullable(),
  roles: z.array(z.nativeEnum(USER_ROLES)).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  phone: z.string().optional(),
});

export const updateManagerSchema = z.object({
  managerId: z.string().nullable().optional(),
  reason: z.string().min(3, 'Reason is required for manager reassignment'),
});

export const importUserRowSchema = z.object({
  employeeCode: z.string().min(2),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().min(1),
  level: z.string(),
  departmentCode: z.string().optional(),
  managerCode: z.string().optional(),
  roles: z.string().optional(), // Comma-separated
});
