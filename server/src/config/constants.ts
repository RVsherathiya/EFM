export const USER_ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  SENIOR: 'SENIOR',
  PM: 'PM',
  HR_ADMIN: 'HR_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const VISIBILITY_SCOPES = {
  SELF: 'SELF',
  DIRECT_REPORTS: 'DIRECT_REPORTS',
  FULL_TREE: 'FULL_TREE',
  PROJECT: 'PROJECT',
  DEPARTMENT: 'DEPARTMENT',
  ORGANISATION: 'ORGANISATION',
} as const;

export type VisibilityScope = (typeof VISIBILITY_SCOPES)[keyof typeof VISIBILITY_SCOPES];

export const PROJECT_TYPES = {
  CLIENT: 'CLIENT',
  INTERNAL: 'INTERNAL',
} as const;

export const BILLING_MODELS = {
  TIME_AND_MATERIAL: 'TIME_AND_MATERIAL',
  FIXED_PRICE: 'FIXED_PRICE',
  NON_BILLABLE: 'NON_BILLABLE',
} as const;

export const PROJECT_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const TASK_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const TASK_CATEGORIES = [
  'Development',
  'Testing',
  'Design',
  'Meeting',
  'Documentation',
  'Support',
  'Training',
  'Other',
] as const;

export const CYCLE_STATUS = {
  PLANNED: 'PLANNED',
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  CALIBRATION: 'CALIBRATION',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const;

export type CycleStatus = (typeof CYCLE_STATUS)[keyof typeof CYCLE_STATUS];

export const REVIEW_STATUS = {
  DRAFT: 'DRAFT',
  SELF_PENDING: 'SELF_PENDING',
  SELF_SUBMITTED: 'SELF_SUBMITTED',
  SENIOR_PENDING: 'SENIOR_PENDING',
  SENIOR_SUBMITTED: 'SENIOR_SUBMITTED',
  PM_PENDING: 'PM_PENDING',
  PM_SUBMITTED: 'PM_SUBMITTED',
  GRADE_CALCULATED: 'GRADE_CALCULATED',
  PUBLISHED: 'PUBLISHED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  DISPUTED: 'DISPUTED',
} as const;

export const REVIEW_STAGES = {
  SELF: 'SELF',
  SENIOR: 'SENIOR',
  PM: 'PM',
  GRADE_CALIBRATION: 'GRADE_CALIBRATION',
  PUBLISH_ACKNOWLEDGE: 'PUBLISH_ACKNOWLEDGE',
} as const;

export const DOCUMENT_CATEGORIES = [
  'SOW / Contract',
  'Requirements',
  'Design',
  'Technical',
  'Meeting Notes',
  'Other',
] as const;

export const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'] as const;
export type Grade = (typeof GRADES)[number];
