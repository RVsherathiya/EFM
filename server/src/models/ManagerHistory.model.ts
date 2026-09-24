import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IManagerHistory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  managerId?: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  changedBy: Types.ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const managerHistorySchema = new Schema<IManagerHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

managerHistorySchema.index({ userId: 1, effectiveFrom: -1 });

export const ManagerHistory = mongoose.model<IManagerHistory>('ManagerHistory', managerHistorySchema);
