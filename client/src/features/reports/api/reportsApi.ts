import { apiClient } from '../../../lib/api/apiClient';

export interface TimesheetTaskDto {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
  };
  projectId: {
    _id: string;
    name: string;
    projectCode: string;
  };
  taskDate: string;
  category: string;
  hours: number;
  isBillable: boolean;
  status: string;
  title: string;
  description?: string;
}

export interface ProjectEffortDto {
  _id: string;
  projectName: string;
  projectCode: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercentage: number;
  taskCount: number;
}

export interface UtilisationDto {
  _id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  totalLoggedHours: number;
  billableHours: number;
  approvedHours: number;
  workingCapacityHours: number;
  utilisationPct: number;
}

export interface CategoryBreakdownDto {
  _id: string;
  totalHours: number;
  taskCount: number;
}

export interface BillableSummaryDto {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  approvedHours: number;
  pendingHours: number;
  totalTasks: number;
  billablePercentage: number;
}

export const reportsApi = {
  getTimesheetReport: async (params: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { tasks: TimesheetTaskDto[]; pagination: { total: number; page: number; totalPages: number } };
    }>('/reports/timesheet', { params });
    return res.data;
  },

  getProjectEffortReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ success: boolean; data: ProjectEffortDto[] }>('/reports/project-effort', {
      params,
    });
    return res.data;
  },

  getUtilisationReport: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ success: boolean; data: UtilisationDto[] }>('/reports/utilisation', {
      params,
    });
    return res.data;
  },

  getCategoryBreakdown: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ success: boolean; data: CategoryBreakdownDto[] }>(
      '/reports/category-breakdown',
      { params }
    );
    return res.data;
  },

  getBillableSummary: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ success: boolean; data: BillableSummaryDto }>('/reports/billable-summary', {
      params,
    });
    return res.data;
  },

  downloadTimesheetCsv: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    window.open(`/api/v1/exports/timesheet?${query}`, '_blank');
  },

  downloadProjectEffortCsv: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    window.open(`/api/v1/exports/project-effort?${query}`, '_blank');
  },

  downloadUtilisationCsv: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    window.open(`/api/v1/exports/utilisation?${query}`, '_blank');
  },
};
