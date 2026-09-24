import { describe, it, expect } from 'vitest';
import { gradeEngine, ReviewEvaluationInput } from '../src/domain/grade-engine/grade.engine.js';

describe('Isolated Pure Domain Grade Engine (BR-GRADE)', () => {
  const defaultCriteria = [
    { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 5 },
    { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 5 },
    { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 5 },
    { criterionId: '4', criterionName: 'Communication', weight: 15, score: 5 },
    { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 5 },
    { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 5 },
  ];

  it('BR-GRADE-003: Score >= 95 with zero missed deadlines and PM exceptional contribution matches A+', () => {
    const input: ReviewEvaluationInput = {
      selfRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      seniorRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      pmRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      selfSubmitted: true,
      missedDeadlines: 0,
      pmExceptionalContribution: true,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(100);
    expect(result.grade).toBe('A+');
    expect(result.flags.requiresHrApproval).toBe(true);
  });

  it('BR-GRADE-003: Score >= 95 WITHOUT PM exceptional contribution demotes to A', () => {
    const input: ReviewEvaluationInput = {
      selfRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      seniorRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      pmRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      selfSubmitted: true,
      missedDeadlines: 0,
      pmExceptionalContribution: false, // Missing exceptional contribution
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(100);
    expect(result.grade).toBe('A');
  });

  it('BR-GRADE-003: Score >= 95 with 1 missed deadline demotes to A', () => {
    const input: ReviewEvaluationInput = {
      selfRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      seniorRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      pmRatings: defaultCriteria.map((c) => ({ ...c, score: 5 })),
      selfSubmitted: true,
      missedDeadlines: 1, // 1 missed deadline
      pmExceptionalContribution: true,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(100);
    expect(result.grade).toBe('A');
  });

  it('BR-GRADE-003: Score 90-94.99 with all criteria >= 4 and missedDeadlines <= 1 matches A', () => {
    // Score ~92%: 4.6 average across criteria
    const ratings = [
      { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 5 },
      { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 5 },
      { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 5 },
      { criterionId: '4', criterionName: 'Communication', weight: 15, score: 4 },
      { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 4 },
      { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 4 },
    ];

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 1,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(93);
    expect(result.grade).toBe('A');
  });

  it('BR-GRADE-003: Score 85-89.99 with all criteria >= 3 matches A-', () => {
    const ratings = [
      { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 4 },
      { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 4 },
      { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 5 },
      { criterionId: '4', criterionName: 'Communication', weight: 15, score: 5 },
      { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 4 },
      { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 4 },
    ];

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(87);
    expect(result.grade).toBe('A-');
  });

  it('BR-GRADE-003: Score 80-84.99 with all criteria >= 3 matches B+', () => {
    // All 4s = 80%
    const ratings = defaultCriteria.map((c) => ({ ...c, score: 4 }));

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(80);
    expect(result.grade).toBe('B+');
  });

  it('BR-GRADE-003: Score 75-79.99 with max 1 criterion < 3 matches B', () => {
    const ratings = [
      { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 4 },
      { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 4 },
      { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 4 },
      { criterionId: '4', criterionName: 'Communication', weight: 15, score: 4 },
      { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 4 },
      { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 2 }, // 1 criterion < 3
    ];

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(76);
    expect(result.grade).toBe('B');
  });

  it('BR-GRADE-003: Score 70-74.99 with Quality >= 3 and max 2 criteria < 3 matches B-', () => {
    const ratings = [
      { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 4 },
      { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 4 },
      { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 3 },
      { criterionId: '4', criterionName: 'Communication', weight: 15, score: 4 },
      { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 3 }, // score 3
      { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 2 }, // 1 criterion < 3
    ];

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(70);
    expect(result.grade).toBe('B-');
  });

  it('BR-GRADE-003: Score 65-69.99 with Quality >= 2 matches C+', () => {
    const ratings = [
      { criterionId: '1', criterionName: 'Quality of Work', weight: 25, score: 3 },
      { criterionId: '2', criterionName: 'Timeliness & Delivery', weight: 20, score: 3 },
      { criterionId: '3', criterionName: 'Technical Skill', weight: 20, score: 3 },
      { criterionId: '4', criterionName: 'Communication', weight: 15, score: 4 },
      { criterionId: '5', criterionName: 'Ownership', weight: 10, score: 4 },
      { criterionId: '6', criterionName: 'Learning & Growth', weight: 10, score: 4 },
    ];

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(67);
    expect(result.grade).toBe('C+');
  });

  it('BR-GRADE-003: Score 60-64.99 matches C if self review is submitted', () => {
    // All 3s = 60%
    const ratings = defaultCriteria.map((c) => ({ ...c, score: 3 }));

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(60);
    expect(result.grade).toBe('C');
  });

  it('BR-GRADE-003: Score < 60 matches C- and flags for HR calibration', () => {
    // All 2s = 40%
    const ratings = defaultCriteria.map((c) => ({ ...c, score: 2 }));

    const input: ReviewEvaluationInput = {
      selfRatings: ratings,
      seniorRatings: ratings,
      pmRatings: ratings,
      selfSubmitted: true,
      missedDeadlines: 2,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.finalScore).toBe(40);
    expect(result.grade).toBe('C-');
    expect(result.flags.requiresHrApproval).toBe(true);
  });

  it('BR-GRADE-002: Proportional redistribution of 10% self-review weight when unsubmitted', () => {
    const seniorRatings = defaultCriteria.map((c) => ({ ...c, score: 4 })); // 80%
    const pmRatings = defaultCriteria.map((c) => ({ ...c, score: 5 })); // 100%

    const input: ReviewEvaluationInput = {
      selfRatings: undefined,
      seniorRatings,
      pmRatings,
      selfSubmitted: false, // Self unsubmitted
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    // Senior weight = 50/90, PM weight = 40/90
    // Final = 80 * (50/90) + 100 * (40/90) = 44.444 + 44.444 = 88.89
    expect(result.finalScore).toBe(88.89);
    expect(result.evaluationContext.effectiveWeights.self).toBe(0);
    expect(result.evaluationContext.effectiveWeights.senior).toBe(55.56);
    expect(result.evaluationContext.effectiveWeights.pm).toBe(44.44);
  });

  it('BR-GRADE-004: Self vs Senior gap > 1.5 triggers gap flag', () => {
    const selfRatings = [{ criterionId: '1', criterionName: 'Quality of Work', weight: 100, score: 5 }];
    const seniorRatings = [{ criterionId: '1', criterionName: 'Quality of Work', weight: 100, score: 3 }]; // Gap is 2.0 > 1.5

    const input: ReviewEvaluationInput = {
      selfRatings,
      seniorRatings,
      selfSubmitted: true,
      missedDeadlines: 0,
    };

    const result = gradeEngine.evaluate(input);
    expect(result.flags.hasGapFlag).toBe(true);
    expect(result.flags.gapDetails[0].gap).toBe(2);
  });
});
