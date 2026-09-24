import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Criterion } from '../../models/Criterion.model.js';
import { auditService } from '../../services/audit.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class CriteriaController {
  public async getCriteria(req: Request, res: Response): Promise<void> {
    const { cycleId } = req.query;
    const filter: Record<string, any> = { isDeleted: false };
    if (cycleId) {
      filter.cycleId = new Types.ObjectId(cycleId as string);
    } else {
      filter.cycleId = null; // Default global template
    }

    const criteria = await Criterion.find(filter).sort({ sortOrder: 1 }).lean();
    sendSuccess(res, criteria);
  }

  public async createCriterion(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const body = req.body;

    const criterion = await Criterion.create({
      cycleId: body.cycleId ? new Types.ObjectId(body.cycleId) : null,
      name: body.name,
      description: body.description,
      weight: body.weight,
      sortOrder: body.sortOrder || 1,
      scoreDefinitions: body.scoreDefinitions,
      isActive: true,
    });

    await auditService.log({
      entity: 'CRITERION',
      entityId: criterion._id.toString(),
      action: 'CRITERION_CREATED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      newValue: { name: criterion.name, weight: criterion.weight },
    });

    sendSuccess(res, criterion, 201);
  }

  public async updateCriterion(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const criterion = await Criterion.findById(req.params.id);
    if (!criterion) throw AppError.notFound('Criterion not found.');

    if (req.body.name) criterion.name = req.body.name;
    if (req.body.description) criterion.description = req.body.description;
    if (req.body.weight !== undefined) criterion.weight = req.body.weight;
    if (req.body.sortOrder !== undefined) criterion.sortOrder = req.body.sortOrder;
    if (req.body.scoreDefinitions) criterion.scoreDefinitions = req.body.scoreDefinitions;
    if (req.body.isActive !== undefined) criterion.isActive = req.body.isActive;

    await criterion.save();

    await auditService.log({
      entity: 'CRITERION',
      entityId: criterion._id.toString(),
      action: 'CRITERION_UPDATED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
    });

    sendSuccess(res, criterion);
  }

  public async deleteCriterion(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const criterion = await Criterion.findById(req.params.id);
    if (!criterion) throw AppError.notFound('Criterion not found.');

    criterion.isDeleted = true;
    await criterion.save();

    await auditService.log({
      entity: 'CRITERION',
      entityId: criterion._id.toString(),
      action: 'CRITERION_DELETED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
    });

    sendSuccess(res, { message: 'Criterion deleted.' });
  }
}

export const criteriaController = new CriteriaController();
