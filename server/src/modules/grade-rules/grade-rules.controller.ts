import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { GradeRule } from '../../models/GradeRule.model.js';
import { gradeEngine } from '../../domain/grade-engine/grade.engine.js';
import { auditService } from '../../services/audit.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class GradeRulesController {
  public async getGradeRules(req: Request, res: Response): Promise<void> {
    const { cycleId } = req.query;
    const filter: Record<string, any> = {};
    if (cycleId) {
      filter.cycleId = new Types.ObjectId(cycleId as string);
    } else {
      filter.cycleId = null;
    }

    const rules = await GradeRule.find(filter).sort({ priority: 1 }).lean();
    sendSuccess(res, rules);
  }

  public async updateGradeRules(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { rules, cycleId } = req.body;

    if (!Array.isArray(rules)) {
      throw AppError.badRequest('Rules must be an array.');
    }

    const cId = cycleId ? new Types.ObjectId(cycleId) : null;
    await GradeRule.deleteMany({ cycleId: cId });

    const createdRules = await GradeRule.insertMany(
      rules.map((r, idx) => ({
        cycleId: cId,
        grade: r.grade,
        priority: idx + 1,
        minScore: r.minScore,
        maxScore: r.maxScore,
        description: r.description,
        conditions: r.conditions || [],
        requiresHrApproval: !!r.requiresHrApproval,
        isActive: true,
      }))
    );

    await auditService.log({
      entity: 'GRADE_RULES',
      entityId: cycleId || 'GLOBAL',
      action: 'GRADE_RULES_UPDATED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      newValue: { count: createdRules.length },
    });

    sendSuccess(res, createdRules);
  }

  public async simulateGrade(req: Request, res: Response): Promise<void> {
    const { selfRatings, seniorRatings, pmRatings, selfSubmitted, missedDeadlines, pmExceptionalContribution } = req.body;

    if (!seniorRatings || seniorRatings.length === 0) {
      throw AppError.badRequest('Senior ratings are required for grade simulation.');
    }

    const result = gradeEngine.evaluate({
      selfRatings: selfRatings || [],
      seniorRatings,
      pmRatings: pmRatings || [],
      selfSubmitted: selfSubmitted !== false,
      missedDeadlines: missedDeadlines || 0,
      pmExceptionalContribution: !!pmExceptionalContribution,
    });

    sendSuccess(res, result);
  }
}

export const gradeRulesController = new GradeRulesController();
