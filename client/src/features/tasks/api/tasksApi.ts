import { apiClient } from '../../../lib/api/apiClient';

export interface TaskDto {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
  } | string;
  projectId: {
    _id: string;
    name: string;
    projectCode: string;
    billingModel: string;
  } | string;
  workDate: string;
  category: string;
  hours: number;
  dueDate?: string;
  title: string;
  description: string;
  isBillable: boolean;
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approvedHours?: number;
  isApprovedBillable?: boolean;
  actionBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  actionAt?: string;
  rejectionReason?: string;
  locked: boolean;
}

export interface TaskFilterParams {
  userId?: string;
  projectId?: string;
  approvalStatus?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PeriodLockDto {
  _id: string;
  yearMonth: string;
  isLocked: boolean;
  lockedAt?: string;
  unlockedAt?: string;
  unlockedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  unlockReason?: string;
}

export const tasksApi = {
  getTasks: async (params?: TaskFilterParams) => {
    const res = await apiClient.get<{ success: boolean; data: TaskDto[]; meta: { total: number; page: number; limit: number } }>('/tasks', { params });
    return res.data;
  },

  getTimesheetGrid: async (startDate: string, endDate: string, userId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: TaskDto[] }>('/tasks/timesheet-grid', {
      params: { startDate, endDate, userId },
    });
    return res.data;
  },

  createTask: async (data: Partial<TaskDto>) => {
    const res = await apiClient.post<{ success: boolean; data: TaskDto }>('/tasks', data);
    return res.data;
  },

  updateTask: async (id: string, data: Partial<TaskDto>) => {
    const res = await apiClient.patch<{ success: boolean; data: TaskDto }>(`/tasks/${id}`, data);
    return res.data;
  },

  deleteTask: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
    return res.data;
  },

  submitTasks: async (taskIds: string[]) => {
    const res = await apiClient.post<{ success: boolean; message: string; modifiedCount: number }>('/tasks/submit', { taskIds });
    return res.data;
  },

  getApprovalQueue: async (params?: { projectId?: string; employeeId?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{ success: boolean; data: TaskDto[]; meta: { total: number } }>('/tasks/approvals', { params });
    return res.data;
  },

  approveTasks: async (data: { taskIds: string[]; action: 'APPROVE_BILLABLE' | 'APPROVE_NON_BILLABLE' }) => {
    const res = await apiClient.post<{ success: boolean; message: string; modifiedCount: number }>('/tasks/approve', data);
    return res.data;
  },

  rejectTasks: async (data: { taskIds: string[]; reason: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; modifiedCount: number }>('/tasks/reject', data);
    return res.data;
  },

  getPeriodLocks: async () => {
    const res = await apiClient.get<{ success: boolean; data: PeriodLockDto[] }>('/period-locks');
    return res.data;
  },

  unlockPeriod: async (yearMonth: string, reason: string) => {
    const res = await apiClient.post<{ success: boolean; data: PeriodLockDto }>(`/period-locks/${yearMonth}/unlock`, { reason });
    return res.data;
  },
};
