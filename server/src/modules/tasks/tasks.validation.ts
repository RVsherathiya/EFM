import { z } from 'zod';
import { TASK_CATEGORIES } from '../../config/constants.js';

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  workDate: z.string().min(1, 'Work date is required'),
  title: z.string().min(2, 'Task title is required').trim(),
  description: z.string().min(3, 'Task description is required').trim(),
  category: z.enum(TASK_CATEGORIES).default('Development'),
  hours: z.number().min(0.25).max(24),
  dueDate: z.string().optional().nullable(),
  billable: z.boolean().default(true),
  submit: z.boolean().default(false), // true = SUBMITTED, false = DRAFT
});

export const updateTaskSchema = createTaskSchema.partial();

export const approveTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID required'),
  action: z.enum(['APPROVE_BILLABLE', 'APPROVE_NON_BILLABLE']),
});

export const rejectTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID required'),
  reason: z.string().min(3, 'A rejection reason is mandatory (BR-TASK-004)'),
});

export const unlockPeriodSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM (e.g. 2026-08)'),
  reason: z.string().min(3, 'A mandatory reason is required for unlocking a period (BR-TASK-005)'),
});
