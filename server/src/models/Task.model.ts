import mongoose, { Document, Schema, Types } from 'mongoose';
import { TASK_STATUS, TASK_CATEGORIES } from '../config/constants.js';

export interface ITask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  workDate: Date; // YYYY-MM-DD
  title: string;
  description: string;
  category: (typeof TASK_CATEGORIES)[number];
  hours: number; // 0.25 increments, max 24
  dueDate?: Date;
  status: (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
  billable: boolean;
  approvalStatus: 'PENDING' | 'APPROVED_BILLABLE' | 'APPROVED_NON_BILLABLE' | 'REJECTED';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    workDate: {
      type: Date,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      default: 'Development',
      required: true,
      index: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0.25,
      max: 24,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.DRAFT,
      index: true,
    },
    billable: {
      type: Boolean,
      default: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED_BILLABLE', 'APPROVED_NON_BILLABLE', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for timesheets and reporting
taskSchema.index({ userId: 1, workDate: 1 });
taskSchema.index({ projectId: 1, workDate: 1 });
taskSchema.index({ status: 1, approvalStatus: 1 });
taskSchema.index({ workDate: 1, billable: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
