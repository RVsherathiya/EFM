import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.model.js';
import { logger } from '../config/logger.js';

export interface AuditLogParams {
  entity: string;
  entityId: string;
  action: string;
  userId?: string | Types.ObjectId;
  userName?: string;
  userEmail?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  public async log(params: AuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId ? new Types.ObjectId(params.userId.toString()) : undefined,
        userName: params.userName,
        userEmail: params.userEmail,
        oldValue: params.oldValue,
        newValue: params.newValue,
        ip: params.ip,
        userAgent: params.userAgent,
        metadata: params.metadata,
      });
    } catch (error) {
      // Never let an audit log failure crash the business transaction, but log error
      logger.error('Failed to write audit log:', error, { params });
    }
  }
}

export const auditService = new AuditService();
