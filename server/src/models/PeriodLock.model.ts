import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPeriodLock extends Document {
  _id: Types.ObjectId;
  yearMonth: string; // YYYY-MM e.g. "2026-08"
  isLocked: boolean;
  unlockedBy?: Types.ObjectId;
  unlockedAt?: Date;
  unlockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const periodLockSchema = new Schema<IPeriodLock>(
  {
    yearMonth: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}$/,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    unlockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    unlockedAt: {
      type: Date,
    },
    unlockReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PeriodLock = mongoose.model<IPeriodLock>('PeriodLock', periodLockSchema);
