import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDelegation extends Document {
  _id: Types.ObjectId;
  delegatorId: Types.ObjectId;
  delegateId: Types.ObjectId;
  scope: 'TASK_APPROVAL' | 'REVIEW_ASSESSMENT' | 'ALL';
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const delegationSchema = new Schema<IDelegation>(
  {
    delegatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    delegateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ['TASK_APPROVAL', 'REVIEW_ASSESSMENT', 'ALL'],
      default: 'ALL',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

delegationSchema.index({ delegatorId: 1, status: 1 });
delegationSchema.index({ delegateId: 1, status: 1 });
delegationSchema.index({ startDate: 1, endDate: 1 });

export const Delegation = mongoose.model<IDelegation>('Delegation', delegationSchema);
