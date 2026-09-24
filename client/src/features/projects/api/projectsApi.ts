import { apiClient, ApiResponse } from '../../../lib/api/apiClient';

export interface Project {
  _id: string;
  projectCode: string;
  name: string;
  client: string;
  type: 'CLIENT' | 'INTERNAL';
  billingModel: 'TIME_AND_MATERIAL' | 'FIXED_PRICE' | 'NON_BILLABLE';
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  projectManagerId: { _id: string; firstName: string; lastName: string; email: string; employeeCode: string; designation: string };
  projectLeadId?: { _id: string; firstName: string; lastName: string; email: string; employeeCode: string; designation: string };
  departmentId?: { _id: string; name: string; code: string };
  clientContact?: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
}

export interface ProjectMember {
  _id: string;
  projectId: string;
  userId: {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    employeeCode: string;
    designation: string;
    level: string;
  };
  projectRole: string;
  allocationPct: number;
  defaultBillable: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface ProjectDocument {
  _id: string;
  projectId: string;
  title: string;
  category: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy: { _id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
}

export const projectsApi = {
  getProjects: async (params?: { page?: number; limit?: number; search?: string; status?: string; type?: string; departmentId?: string }) => {
    const response = await apiClient.get<ApiResponse<Project[]>>('/projects', { params });
    return {
      projects: response.data.data,
      meta: response.data.meta as { page: number; limit: number; total: number; totalPages: number },
    };
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data;
  },

  createProject: async (data: Record<string, unknown>): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return response.data.data;
  },

  updateProject: async (id: string, updates: Record<string, unknown>): Promise<Project> => {
    const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, updates);
    return response.data.data;
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`);
    return response.data.data;
  },

  addProjectMember: async (projectId: string, data: Record<string, unknown>): Promise<{ member: ProjectMember; allocationWarning?: string }> => {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, data);
    return {
      member: response.data.data,
      allocationWarning: response.data.meta?.allocationWarning as string | undefined,
    };
  },

  removeProjectMember: async (projectId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  },

  getProjectDocuments: async (projectId: string): Promise<ProjectDocument[]> => {
    const response = await apiClient.get<ApiResponse<ProjectDocument[]>>(`/projects/${projectId}/documents`);
    return response.data.data;
  },

  uploadDocument: async (projectId: string, formData: FormData): Promise<ProjectDocument> => {
    const response = await apiClient.post<ApiResponse<ProjectDocument>>(`/projects/${projectId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  getDocumentDownloadUrl: (docId: string): string => {
    return `/api/v1/projects/documents/${docId}/download`;
  },
};
