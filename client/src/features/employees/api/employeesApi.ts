import { apiClient, ApiResponse } from '../../../lib/api/apiClient';

export interface Employee {
  _id: string;
  id: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation: string;
  level: string;
  departmentId?: { _id: string; name: string; code: string };
  managerId?: { _id: string; firstName: string; lastName: string; email: string; employeeCode: string; designation: string };
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  joinedDate?: string;
  createdAt: string;
}

export interface DepartmentItem {
  _id: string;
  name: string;
  code: string;
  headId?: { _id: string; firstName: string; lastName: string; email: string; employeeCode: string };
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface OrgTreeNode extends Employee {
  children?: OrgTreeNode[];
}

export const employeesApi = {
  getEmployees: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; role?: string }) => {
    const response = await apiClient.get<ApiResponse<Employee[]>>('/users', { params });
    return {
      employees: response.data.data,
      meta: response.data.meta as { page: number; limit: number; total: number; totalPages: number },
    };
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/users/${id}`);
    return response.data.data;
  },

  createEmployee: async (data: Partial<Employee> & { password?: string }): Promise<Employee> => {
    const response = await apiClient.post<ApiResponse<Employee>>('/users', data);
    return response.data.data;
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/users/${id}`, updates);
    return response.data.data;
  },

  updateManager: async (id: string, data: { managerId: string | null; reason: string }): Promise<void> => {
    await apiClient.patch(`/users/${id}/manager`, data);
  },

  importEmployees: async (rows: Array<Record<string, unknown>>, commit = false) => {
    const response = await apiClient.post<ApiResponse<{ totalRows: number; validCount: number; errorCount: number; errors: Array<{ row: number; employeeCode: string; message: string }>; preview?: Array<Record<string, unknown>>; success?: boolean }>>('/users/import', {
      rows,
      commit,
    });
    return response.data.data;
  },

  getOrgTree: async (): Promise<OrgTreeNode[]> => {
    const response = await apiClient.get<ApiResponse<OrgTreeNode[]>>('/org/tree');
    return response.data.data;
  },

  getDepartments: async (): Promise<DepartmentItem[]> => {
    const response = await apiClient.get<ApiResponse<DepartmentItem[]>>('/departments');
    return response.data.data;
  },

  createDepartment: async (data: { name: string; code: string; headId?: string | null; description?: string }): Promise<DepartmentItem> => {
    const response = await apiClient.post<ApiResponse<DepartmentItem>>('/departments', data);
    return response.data.data;
  },

  updateDepartment: async (id: string, updates: Partial<DepartmentItem>): Promise<DepartmentItem> => {
    const response = await apiClient.patch<ApiResponse<DepartmentItem>>(`/departments/${id}`, updates);
    return response.data.data;
  },
};
