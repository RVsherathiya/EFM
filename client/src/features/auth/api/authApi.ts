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
  managerId?: { _id: string; firstName: string; lastName: string; email: string; employeeCode?: string; designation?: string } | string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  joinedDate?: string;
  createdAt?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  message?: string;
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

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
    return response.data?.data || { message: 'Logged out successfully.' };
  },

  forgotPassword: async (email: string): Promise<{ message: string; devResetUrl?: string; token?: string; email?: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string; devResetUrl?: string; token?: string; email?: string }>>('/auth/forgot-password', { email });
    return response.data.data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email?: string }> => {
    const response = await apiClient.get<ApiResponse<{ valid: boolean; email?: string }>>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
    return response.data.data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', payload);
    return response.data.data;
  },

  resetPasswordWithOld: async (payload: { email: string; oldPassword: string; newPassword: string; token?: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password-with-old', payload);
    return response.data.data;
  },
};
