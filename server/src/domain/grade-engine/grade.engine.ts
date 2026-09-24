import { IGradeRule } from '../../models/GradeRule.model.js';

export interface CriterionRatingInput {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number; // 1 to 5
}

export interface ReviewEvaluationInput {
  selfRatings?: CriterionRatingInput[];
  seniorRatings: CriterionRatingInput[];
  pmRatings?: CriterionRatingInput[];
  selfSubmitted: boolean;
  missedDeadlines: number;
  pmExceptionalContribution?: boolean;
  seniorJustificationProvided?: boolean;
  customRules?: IGradeRule[];
}

export interface CalibrationFlags {
  hasGapFlag: boolean;
  gapDetails: Array<{ criterionName: string; selfScore: number; seniorScore: number; gap: number }>;
  hasDiscrepancyFlag: boolean;
  discrepancyDetails?: { seniorGrade: string; pmGrade: string; stepDifference: number };
  requiresHrApproval: boolean;
  approvalReasons: string[];
}

export interface GradeEvaluationResult {
  finalScore: number;
  grade: string;
  matchedRuleId?: string;
  matchedRuleDescription?: string;
  flags: CalibrationFlags;
  evaluationContext: {
    selfScorePct?: number;
    seniorScorePct: number;
    pmScorePct?: number;
    effectiveWeights: { self: number; senior: number; pm: number };
    missedDeadlines: number;
    pmExceptionalContribution: boolean;
  };
}

const GRADE_STEPS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

export class GradeEngine {
  /**
   * BR-GRADE-001: Calculates score percentage (0-100) for a set of criterion ratings
   */
  public calculateReviewerScore(ratings: CriterionRatingInput[]): number {
    if (!ratings || ratings.length === 0) return 0;
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0) || 100;
    const weightedSum = ratings.reduce((sum, r) => {
      // (score / 5) * weight
      return sum + (r.score / 5) * r.weight;
    }, 0);
    return Math.round((weightedSum / totalWeight) * 100 * 100) / 100;
  }

  /**
   * BR-GRADE-001 & BR-GRADE-002: Determines weights redistributing missing self-review proportionally
   */
  public getEffectiveWeights(hasSelf: boolean, hasPM: boolean): { self: number; senior: number; pm: number } {
    if (!hasSelf) {
      if (hasPM) {
        // Self 10% redistributed to Senior (50) and PM (40):
        // Senior: 50/90 = 55.56%, PM: 40/90 = 44.44%
        return {
          self: 0,
          senior: 50 / 90,
          pm: 40 / 90,
        };
      }
      return { self: 0, senior: 1.0, pm: 0 };
    }

    if (!hasPM) {
      return {
        self: 0.1,
        senior: 0.9,
        pm: 0,
      };
    }

    return {
      self: 0.1,
      senior: 0.5,
      pm: 0.4,
    };
  }

  /**
   * Calculates overall composite score 0-100
   */
  public calculateFinalScore(
    selfScorePct: number | undefined,
    seniorScorePct: number,
    pmScorePct: number | undefined,
    selfSubmitted: boolean
  ): { finalScore: number; weights: { self: number; senior: number; pm: number } } {
    const hasPM = pmScorePct !== undefined;
    const weights = this.getEffectiveWeights(selfSubmitted && selfScorePct !== undefined, hasPM);

    const sScore = selfSubmitted && selfScorePct !== undefined ? selfScorePct : 0;
    const pScore = pmScorePct !== undefined ? pmScorePct : 0;

    const rawFinal = sScore * weights.self + seniorScorePct * weights.senior + pScore * weights.pm;
    const finalScore = Math.round(rawFinal * 100) / 100;

    return { finalScore, weights };
  }

  /**
   * BR-GRADE-004: Evaluates calibration flags
   */
  public evaluateCalibrationFlags(
    input: ReviewEvaluationInput,
    evaluatedGrade: string,
    seniorGrade: string,
    pmGrade?: string
  ): CalibrationFlags {
    const gapDetails: Array<{ criterionName: string; selfScore: number; seniorScore: number; gap: number }> = [];

    // 1. Self vs Senior gap > 1.5 on any criterion
    if (input.selfSubmitted && input.selfRatings && input.selfRatings.length > 0) {
      for (const selfRating of input.selfRatings) {
        const matchingSenior = input.seniorRatings.find(
          (sr) => sr.criterionId.toString() === selfRating.criterionId.toString() || sr.criterionName.toLowerCase() === selfRating.criterionName.toLowerCase()
        );
        if (matchingSenior) {
          const gap = Math.abs(selfRating.score - matchingSenior.score);
          if (gap > 1.5) {
            gapDetails.push({
              criterionName: selfRating.criterionName,
              selfScore: selfRating.score,
              seniorScore: matchingSenior.score,
              gap: Math.round(gap * 100) / 100,
            });
          }
        }
      }
    }

    // 2. Senior vs PM discrepancy >= 2 steps
    let hasDiscrepancyFlag = false;
    let discrepancyDetails: { seniorGrade: string; pmGrade: string; stepDifference: number } | undefined;

    if (pmGrade) {
      const seniorIdx = GRADE_STEPS.indexOf(seniorGrade);
      const pmIdx = GRADE_STEPS.indexOf(pmGrade);
      if (seniorIdx !== -1 && pmIdx !== -1) {
        const stepDifference = Math.abs(seniorIdx - pmIdx);
        if (stepDifference >= 2) {
          hasDiscrepancyFlag = true;
          discrepancyDetails = { seniorGrade, pmGrade, stepDifference };
        }
      }
    }

    // 3. Extreme grade approval required (A+ or C-)
    const approvalReasons: string[] = [];
    if (evaluatedGrade === 'A+') {
      approvalReasons.push('A+ grade requires mandatory HR calibration & approval.');
    }
    if (evaluatedGrade === 'C-') {
      approvalReasons.push('C- performance rating requires mandatory HR review and PIP assessment.');
    }

    const requiresHrApproval = approvalReasons.length > 0;

    return {
      hasGapFlag: gapDetails.length > 0,
      gapDetails,
      hasDiscrepancyFlag,
      discrepancyDetails,
      requiresHrApproval,
      approvalReasons,
    };
  }

  /**
   * Evaluates standard default grade rules or custom rules stored in MongoDB
   */
  public evaluate(input: ReviewEvaluationInput): GradeEvaluationResult {
    const selfScorePct = input.selfSubmitted && input.selfRatings ? this.calculateReviewerScore(input.selfRatings) : undefined;
    const seniorScorePct = this.calculateReviewerScore(input.seniorRatings);
    const pmScorePct = input.pmRatings ? this.calculateReviewerScore(input.pmRatings) : undefined;

    const { finalScore, weights } = this.calculateFinalScore(selfScorePct, seniorScorePct, pmScorePct, input.selfSubmitted);

    // Collect all reviewer ratings (Senior + PM)
    const combinedReviewerRatings = [...input.seniorRatings, ...(input.pmRatings || [])];

    // Helper criteria lookups
    const qualityRating = input.seniorRatings.find((r) => r.criterionName.toLowerCase().includes('quality'));
    const qualityScore = qualityRating ? qualityRating.score : 3;

    const allCriteriaGte4 = combinedReviewerRatings.every((r) => r.score >= 4);
    const allCriteriaGte3 = combinedReviewerRatings.every((r) => r.score >= 3);

    // Count distinct criteria that have any rating < 3
    const criteriaWithScoreBelow3 = new Set<string>();
    combinedReviewerRatings.forEach((r) => {
      if (r.score < 3) {
        criteriaWithScoreBelow3.add(r.criterionName.toLowerCase());
      }
    });
    const countBelow3 = criteriaWithScoreBelow3.size;

    let matchedGrade = 'C-';
    let matchedRuleDescription = 'Default fallback rating';
    let matchedRuleId: string | undefined;

    // Evaluate Default Specification Rules (BR-GRADE-003)
    if (
      finalScore >= 95 &&
      allCriteriaGte4 &&
      input.missedDeadlines === 0 &&
      input.pmExceptionalContribution === true
    ) {
      matchedGrade = 'A+';
      matchedRuleDescription = 'Score >= 95, No criterion < 4, Zero missed deadlines, and PM Exceptional Contribution.';
    } else if (
      finalScore >= 90 &&
      allCriteriaGte4 &&
      input.missedDeadlines <= 1
    ) {
      matchedGrade = 'A';
      matchedRuleDescription = 'Score >= 90, No criterion < 4, and Maximum 1 missed deadline.';
    } else if (
      finalScore >= 85 &&
      allCriteriaGte3
    ) {
      matchedGrade = 'A-';
      matchedRuleDescription = 'Score >= 85 and No criterion < 3.';
    } else if (
      finalScore >= 80 &&
      allCriteriaGte3
    ) {
      matchedGrade = 'B+';
      matchedRuleDescription = 'Score >= 80 and No criterion < 3.';
    } else if (
      finalScore >= 75 &&
      countBelow3 <= 1
    ) {
      matchedGrade = 'B';
      matchedRuleDescription = 'Score >= 75 and Maximum 1 criterion < 3.';
    } else if (
      finalScore >= 70 &&
      countBelow3 <= 2 &&
      qualityScore >= 3
    ) {
      matchedGrade = 'B-';
      matchedRuleDescription = 'Score >= 70, Maximum 2 criteria < 3, and Quality of Work >= 3.';
    } else if (
      finalScore >= 65 &&
      qualityScore >= 2
    ) {
      matchedGrade = 'C+';
      matchedRuleDescription = 'Score >= 65 and Quality of Work >= 2.';
    } else if (
      finalScore >= 60 &&
      (input.selfSubmitted === true || input.seniorJustificationProvided === true)
    ) {
      matchedGrade = 'C';
      matchedRuleDescription = 'Score >= 60 with Self Review submitted or Senior justification provided.';
    } else {
      matchedGrade = 'C-';
      matchedRuleDescription = 'Score below 60 or failed minimum progression thresholds.';
    }

    // Determine Senior and PM independent grades for discrepancy check
    const seniorOnlyGrade = this.evaluateSingleReviewerGrade(seniorScorePct);
    const pmOnlyGrade = pmScorePct !== undefined ? this.evaluateSingleReviewerGrade(pmScorePct) : undefined;

    const flags = this.evaluateCalibrationFlags(input, matchedGrade, seniorOnlyGrade, pmOnlyGrade);

    return {
      finalScore,
      grade: matchedGrade,
      matchedRuleId,
      matchedRuleDescription,
      flags,
      evaluationContext: {
        selfScorePct,
        seniorScorePct,
        pmScorePct,
        effectiveWeights: {
          self: Math.round(weights.self * 100 * 100) / 100,
          senior: Math.round(weights.senior * 100 * 100) / 100,
          pm: Math.round(weights.pm * 100 * 100) / 100,
        },
        missedDeadlines: input.missedDeadlines,
        pmExceptionalContribution: !!input.pmExceptionalContribution,
      },
    };
  }

  private evaluateSingleReviewerGrade(scorePct: number): string {
    if (scorePct >= 95) return 'A+';
    if (scorePct >= 90) return 'A';
    if (scorePct >= 85) return 'A-';
    if (scorePct >= 80) return 'B+';
    if (scorePct >= 75) return 'B';
    if (scorePct >= 70) return 'B-';
    if (scorePct >= 65) return 'C+';
    if (scorePct >= 60) return 'C';
    return 'C-';
  }
}

export const gradeEngine = new GradeEngine();
