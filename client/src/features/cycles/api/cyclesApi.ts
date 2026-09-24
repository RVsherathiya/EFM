import { apiClient } from '../../../lib/api/apiClient';

export interface CycleDto {
  _id: string;
  name: string;
  code: string;
  year: number;
  cycleNumber: number;
  periodStart: string;
  periodEnd: string;
  selfReviewStart: string;
  selfReviewEnd: string;
  seniorReviewStart: string;
  seniorReviewEnd: string;
  pmReviewStart: string;
  pmReviewEnd: string;
  gradeCalibrationStart: string;
  gradeCalibrationEnd: string;
  publishDate: string;
  status: 'PLANNED' | 'OPEN' | 'IN_REVIEW' | 'CALIBRATION' | 'PUBLISHED' | 'CLOSED';
  description?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export const cyclesApi = {
  getCycles: async () => {
    const res = await apiClient.get<{ success: boolean; data: CycleDto[] }>('/cycles');
    return res.data;
  },

  getCycleById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: CycleDto }>(`/cycles/${id}`);
    return res.data;
  },

  createCycle: async (data: Partial<CycleDto>) => {
    const res = await apiClient.post<{ success: boolean; data: CycleDto }>('/cycles', data);
    return res.data;
  },

  openCycle: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: { cycle: CycleDto; reviewsInitiated: number } }>(`/cycles/${id}/open`);
    return res.data;
  },

  closeCycle: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: CycleDto }>(`/cycles/${id}/close`);
    return res.data;
  },
};
