import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Delegation } from '../../models/Delegation.model.js';
import { User } from '../../models/User.model.js';
import { auditService } from '../../services/audit.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

const createDelegationSchema = z.object({
  delegateId: z.string().min(1),
  scope: z.enum(['TASK_APPROVAL', 'REVIEW_ASSESSMENT', 'ALL']).default('ALL'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(3),
});

export class DelegationsController {
  public async getDelegations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const delegations = await Delegation.find({
        $or: [{ delegatorId: req.user._id }, { delegateId: req.user._id }],
      })
        .populate('delegatorId', 'firstName lastName email employeeCode')
        .populate('delegateId', 'firstName lastName email employeeCode')
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, delegations);
    } catch (error) {
      next(error);
    }
  }

  public async createDelegation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = createDelegationSchema.parse(req.body);

      const delegate = await User.findOne({ _id: validatedData.delegateId, isDeleted: false });
      if (!delegate) {
        throw AppError.notFound('Delegate employee not found.');
      }

      if (req.user._id.equals(delegate._id)) {
        throw AppError.badRequest('You cannot delegate permissions to yourself.');
      }

      const delegation = await Delegation.create({
        delegatorId: req.user._id,
        delegateId: delegate._id,
        scope: validatedData.scope,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        reason: validatedData.reason,
      });

      await auditService.log({
        entity: 'DELEGATION',
        entityId: delegation._id.toString(),
        action: 'DELEGATION_CREATED',
        userId: req.user._id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userEmail: req.user.email,
        newValue: { delegateId: delegate._id, scope: validatedData.scope },
      });

      sendSuccess(res, delegation, 201);
    } catch (error) {
      next(error);
    }
  }

  public async revokeDelegation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const delegation = await Delegation.findById(req.params.id);
      if (!delegation) {
        throw AppError.notFound('Delegation record not found.');
      }

      if (!delegation.delegatorId.equals(req.user._id) && !req.user.roles.includes('HR_ADMIN') && !req.user.roles.includes('SUPER_ADMIN')) {
        throw AppError.forbidden('You can only revoke your own delegations.');
      }

      delegation.status = 'REVOKED';
      await delegation.save();

      await auditService.log({
        entity: 'DELEGATION',
        entityId: delegation._id.toString(),
        action: 'DELEGATION_REVOKED',
        userId: req.user._id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userEmail: req.user.email,
      });

      sendSuccess(res, { message: 'Delegation revoked successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const delegationsController = new DelegationsController();
