import { Request, Response } from 'express';
import { Cycle } from '../../models/Cycle.model.js';
import { Criterion } from '../../models/Criterion.model.js';
import { Review } from '../../models/Review.model.js';
import { User } from '../../models/User.model.js';
import { auditService } from '../../services/audit.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';
import { CYCLE_STATUS, REVIEW_STATUS } from '../../config/constants.js';

export class CyclesController {
  public async getCycles(_req: Request, res: Response): Promise<void> {
    const cycles = await Cycle.find({ isDeleted: false })
      .populate('createdBy', 'firstName lastName email')
      .sort({ year: -1, cycleNumber: -1 })
      .lean();
    sendSuccess(res, cycles);
  }

  public async getCycleById(req: Request, res: Response): Promise<void> {
    const cycle = await Cycle.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'firstName lastName email')
      .lean();
    if (!cycle) throw AppError.notFound('Cycle not found.');
    sendSuccess(res, cycle);
  }

  public async createCycle(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const body = req.body;

    const existing = await Cycle.findOne({
      year: body.year,
      cycleNumber: body.cycleNumber,
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`Cycle ${body.year}-C${body.cycleNumber} already exists.`);
    }

    const code = `${body.year}-C${body.cycleNumber}`;
    const cycle = await Cycle.create({
      name: body.name || `${code} Appraisal Cycle`,
      code,
      year: body.year,
      cycleNumber: body.cycleNumber,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      selfReviewStart: new Date(body.selfReviewStart),
      selfReviewEnd: new Date(body.selfReviewEnd),
      seniorReviewStart: new Date(body.seniorReviewStart),
      seniorReviewEnd: new Date(body.seniorReviewEnd),
      pmReviewStart: new Date(body.pmReviewStart),
      pmReviewEnd: new Date(body.pmReviewEnd),
      gradeCalibrationStart: new Date(body.gradeCalibrationStart),
      gradeCalibrationEnd: new Date(body.gradeCalibrationEnd),
      publishDate: new Date(body.publishDate),
      description: body.description,
      createdBy: user._id,
      status: CYCLE_STATUS.PLANNED,
    });

    // BR-CYCLE-003: Snapshot criteria for this cycle
    const globalCriteria = await Criterion.find({ cycleId: null, isDeleted: false });
    if (globalCriteria.length > 0) {
      for (const gc of globalCriteria) {
        await Criterion.create({
          cycleId: cycle._id,
          name: gc.name,
          description: gc.description,
          weight: gc.weight,
          sortOrder: gc.sortOrder,
          scoreDefinitions: gc.scoreDefinitions,
          isActive: true,
        });
      }
    }

    await auditService.log({
      entity: 'CYCLE',
      entityId: cycle._id.toString(),
      action: 'CYCLE_CREATED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      newValue: { code, year: cycle.year, cycleNumber: cycle.cycleNumber },
    });

    sendSuccess(res, cycle, 201);
  }

  public async openCycle(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) throw AppError.notFound('Cycle not found.');

    cycle.status = CYCLE_STATUS.OPEN;
    await cycle.save();

    // Generate Review documents for all active employees
    const activeEmployees = await User.find({ status: 'ACTIVE', isDeleted: false });
    let createdCount = 0;

    for (const emp of activeEmployees) {
      if (!emp.managerId) continue; // Top-level executives without manager skip standard subordinate appraisal
      const existing = await Review.findOne({ cycleId: cycle._id, employeeId: emp._id });
      if (!existing) {
        await Review.create({
          cycleId: cycle._id,
          employeeId: emp._id,
          departmentId: emp.departmentId,
          seniorId: emp.managerId,
          status: REVIEW_STATUS.SELF_PENDING,
        });
        createdCount++;
      }
    }

    await auditService.log({
      entity: 'CYCLE',
      entityId: cycle._id.toString(),
      action: 'CYCLE_OPENED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      newValue: { status: cycle.status, reviewsInitiated: createdCount },
    });

    sendSuccess(res, { cycle, reviewsInitiated: createdCount });
  }

  public async closeCycle(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) throw AppError.notFound('Cycle not found.');

    cycle.status = CYCLE_STATUS.CLOSED;
    await cycle.save();

    await auditService.log({
      entity: 'CYCLE',
      entityId: cycle._id.toString(),
      action: 'CYCLE_CLOSED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
    });

    sendSuccess(res, cycle);
  }
}

export const cyclesController = new CyclesController();
