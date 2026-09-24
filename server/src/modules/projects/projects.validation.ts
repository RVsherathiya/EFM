import { z } from 'zod';
import { PROJECT_TYPES, BILLING_MODELS, PROJECT_STATUS, DOCUMENT_CATEGORIES } from '../../config/constants.js';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required').trim(),
  client: z.string().min(2, 'Client / Business Unit is required').trim(),
  type: z.nativeEnum(PROJECT_TYPES).default(PROJECT_TYPES.CLIENT),
  billingModel: z.nativeEnum(BILLING_MODELS).default(BILLING_MODELS.TIME_AND_MATERIAL),
  description: z.string().optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  status: z.nativeEnum(PROJECT_STATUS).default(PROJECT_STATUS.ACTIVE),
  projectManagerId: z.string().min(1, 'Project Manager is required'),
  projectLeadId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  clientContact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
    })
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'Employee is required'),
  projectRole: z.string().min(1, 'Project role is required').default('Team Member'),
  allocationPct: z.number().min(0).max(100).default(100),
  defaultBillable: z.boolean().default(true),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
});

export const updateProjectMemberSchema = addProjectMemberSchema.partial();

export const createDocumentSchema = z.object({
  title: z.string().min(2, 'Document title is required').trim(),
  category: z.enum(DOCUMENT_CATEGORIES).default('Technical'),
  description: z.string().optional(),
});
