import { apiClient, ApiResponse } from '../../../lib/api/apiClient';

export interface AuthUser {
  id: string;
  _id: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation: string;
  level: string;
  departmentId?: { _id: string; name: string; code: string } | string;
  managerId?: { _id: string; firstName: string; lastName: string; email: string } | string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
