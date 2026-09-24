import { apiClient } from '../../../lib/api/apiClient';

export interface ScoreDefinitionDto {
  score: number;
  label: string;
  description: string;
}

export interface CriterionDto {
  _id: string;
  cycleId?: string | null;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
  scoreDefinitions: ScoreDefinitionDto[];
  isActive: boolean;
}

export const criteriaApi = {
  getCriteria: async (cycleId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: CriterionDto[] }>('/criteria', {
      params: { cycleId },
    });
    return res.data;
  },

  createCriterion: async (data: Partial<CriterionDto>) => {
    const res = await apiClient.post<{ success: boolean; data: CriterionDto }>('/criteria', data);
    return res.data;
  },

  updateCriterion: async (id: string, data: Partial<CriterionDto>) => {
    const res = await apiClient.patch<{ success: boolean; data: CriterionDto }>(`/criteria/${id}`, data);
    return res.data;
  },

  deleteCriterion: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/criteria/${id}`);
    return res.data;
  },
};
