import { apiClient } from '../../../lib/api/apiClient';
import { CriterionDto } from '../../criteria/api/criteriaApi';

export interface ReviewRatingDto {
  _id?: string;
  criterionId: string;
  reviewerType: 'SELF' | 'SENIOR' | 'PM';
  score: number;
  comment: string;
}

export interface ReviewFeedbackDto {
  _id?: string;
  reviewerType: 'SELF' | 'SENIOR' | 'PM';
  achievements?: string;
  strengths?: string;
  areasOfImprovement?: string;
  actionItems?: string;
  pmExceptionalContribution?: boolean;
  pmExceptionalContributionDetails?: string;
  seniorJustification?: string;
}

export interface ReviewMetricDto {
  totalLoggedHours: number;
  totalApprovedHours: number;
  billableHours: number;
  billablePercentage: number;
  tasksCompleted: number;
  missedDeadlines: number;
  hoursByCategory: Record<string, number>;
  hoursByProject: Array<{ projectId: string; projectName: string; hours: number }>;
}

export interface OverrideDto {
  _id: string;
  originalGrade: string;
  originalScore: number;
  overriddenGrade: string;
  overriddenScore?: number;
  reason: string;
  overriddenBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface ReviewDto {
  _id: string;
  cycleId: {
    _id: string;
    name: string;
    code: string;
    periodStart: string;
    periodEnd: string;
  };
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
    designation: string;
  };
  seniorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
  };
  pmId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
  };
  status: string;
  selfSubmittedAt?: string;
  seniorSubmittedAt?: string;
  pmSubmittedAt?: string;
  pmSendBackCount: number;
  pmSendBackReason?: string;
  finalScore?: number;
  calculatedGrade?: string;
  publishedAt?: string;
  acknowledgedAt?: string;
  employeeComments?: string;
  isDisputed: boolean;
  disputeReason?: string;
  disputedAt?: string;
}

export interface ReviewDetailResponse {
  review: ReviewDto;
  criteria: CriterionDto[];
  ratings: ReviewRatingDto[];
  feedback: ReviewFeedbackDto[];
  metrics?: ReviewMetricDto;
  overrides: OverrideDto[];
  permissions: {
    canSubmitSelf: boolean;
    canSubmitSenior: boolean;
    canSubmitPM: boolean;
    canSendBack: boolean;
    canOverride: boolean;
    canPublish: boolean;
    canAcknowledge: boolean;
    canDispute: boolean;
  };
}

export const reviewsApi = {
  getMyReviews: async () => {
    const res = await apiClient.get<{ success: boolean; data: ReviewDto[] }>('/reviews/my');
    return res.data;
  },

  getPendingReviews: async () => {
    const res = await apiClient.get<{ success: boolean; data: ReviewDto[] }>('/reviews/pending');
    return res.data;
  },

  getCalibrationReviews: async (cycleId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: ReviewDto[] }>('/reviews/calibration', {
      params: { cycleId },
    });
    return res.data;
  },

  getReviewDetail: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: ReviewDetailResponse }>(`/reviews/${id}`);
    return res.data;
  },

  submitSelf: async (id: string, data: {
    ratings: Array<{ criterionId: string; score: number; comment?: string }>;
    achievements?: string;
    strengths?: string;
    areasOfImprovement?: string;
    actionItems?: string;
    isDraft?: boolean;
  }) => {
    const res = await apiClient.put<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/self`, data);
    return res.data;
  },

  submitSenior: async (id: string, data: {
    ratings: Array<{ criterionId: string; score: number; comment?: string }>;
    strengths?: string;
    areasOfImprovement?: string;
    actionItems?: string;
    seniorJustification?: string;
    isDraft?: boolean;
  }) => {
    const res = await apiClient.put<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/senior`, data);
    return res.data;
  },

  submitPM: async (id: string, data: {
    ratings: Array<{ criterionId: string; score: number; comment?: string }>;
    pmExceptionalContribution?: boolean;
    pmExceptionalContributionDetails?: string;
    feedback?: string;
    isDraft?: boolean;
  }) => {
    const res = await apiClient.put<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/pm`, data);
    return res.data;
  },

  sendBack: async (id: string, reason: string) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/send-back`, { reason });
    return res.data;
  },

  overrideGrade: async (id: string, grade: string, reason: string, score?: number) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/override`, {
      grade,
      reason,
      score,
    });
    return res.data;
  },

  publishReview: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/publish`);
    return res.data;
  },

  acknowledgeReview: async (id: string, comments?: string) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/acknowledge`, { comments });
    return res.data;
  },

  disputeReview: async (id: string, reason: string) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewDto }>(`/reviews/${id}/dispute`, { reason });
    return res.data;
  },
};
