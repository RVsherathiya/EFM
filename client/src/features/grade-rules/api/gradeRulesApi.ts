import { apiClient } from '../../../lib/api/apiClient';

export interface GradeRuleConditionDto {
  field: string;
  operator: string;
  value: any;
  criterionName?: string;
  thresholdScore?: number;
}

export interface GradeRuleDto {
  _id?: string;
  cycleId?: string | null;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-';
  priority: number;
  minScore: number;
  maxScore: number;
  description: string;
  conditions: GradeRuleConditionDto[];
  requiresHrApproval: boolean;
}

export interface SimulationResultDto {
  finalScore: number;
  grade: string;
  matchedRuleDescription: string;
  flags: {
    hasGapFlag: boolean;
    gapDetails: Array<{ criterionName: string; selfScore: number; seniorScore: number; gap: number }>;
    hasDiscrepancyFlag: boolean;
    discrepancyDetails?: { seniorGrade: string; pmGrade: string; stepDifference: number };
    requiresHrApproval: boolean;
    approvalReasons: string[];
  };
  evaluationContext: {
    selfScorePct?: number;
    seniorScorePct: number;
    pmScorePct?: number;
    effectiveWeights: { self: number; senior: number; pm: number };
    missedDeadlines: number;
    pmExceptionalContribution: boolean;
  };
}

export const gradeRulesApi = {
  getGradeRules: async (cycleId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: GradeRuleDto[] }>('/grade-rules', {
      params: { cycleId },
    });
    return res.data;
  },

  updateGradeRules: async (rules: GradeRuleDto[], cycleId?: string) => {
    const res = await apiClient.put<{ success: boolean; data: GradeRuleDto[] }>('/grade-rules', {
      rules,
      cycleId,
    });
    return res.data;
  },

  simulateGrade: async (simulationInput: {
    selfRatings?: Array<{ criterionId: string; criterionName: string; weight: number; score: number }>;
    seniorRatings: Array<{ criterionId: string; criterionName: string; weight: number; score: number }>;
    pmRatings?: Array<{ criterionId: string; criterionName: string; weight: number; score: number }>;
    selfSubmitted?: boolean;
    missedDeadlines?: number;
    pmExceptionalContribution?: boolean;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: SimulationResultDto }>('/grade-rules/simulate', simulationInput);
    return res.data;
  },
};
