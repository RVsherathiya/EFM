import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  PROJECT_TYPES,
  BILLING_MODELS,
  PROJECT_STATUS,
} from '../config/constants.js';

export interface IProject extends Document {
  _id: Types.ObjectId;
  projectCode: string;
  name: string;
  client: string; // Client or internal business unit
  type: (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];
  billingModel: (typeof BILLING_MODELS)[keyof typeof BILLING_MODELS];
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
  projectManagerId: Types.ObjectId;
  projectLeadId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  clientContact?: {
    name: string;
    email: string;
    phone?: string;
  };
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    client: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PROJECT_TYPES),
      default: PROJECT_TYPES.CLIENT,
      required: true,
    },
    billingModel: {
      type: String,
      enum: Object.values(BILLING_MODELS),
      default: BILLING_MODELS.TIME_AND_MATERIAL,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.ACTIVE,
      index: true,
    },
    projectManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    clientContact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ status: 1, type: 1 });
projectSchema.index({ projectManagerId: 1, status: 1 });
projectSchema.index({ name: 'text', client: 'text', projectCode: 'text' });

export const Project = mongoose.model<IProject>('Project', projectSchema);
