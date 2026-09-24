import mongoose, { Document, Schema, Types } from 'mongoose';
import { CYCLE_STATUS } from '../config/constants.js';

export interface ICycle extends Document {
  _id: Types.ObjectId;
  name: string; // e.g. "2026-C1 (Jan - Feb)"
  code: string; // e.g. "2026-C1"
  year: number; // e.g. 2026
  cycleNumber: number; // 1 to 6
  periodStart: Date;
  periodEnd: Date;
  selfReviewStart: Date;
  selfReviewEnd: Date;
  seniorReviewStart: Date;
  seniorReviewEnd: Date;
  pmReviewStart: Date;
  pmReviewEnd: Date;
  gradeCalibrationStart: Date;
  gradeCalibrationEnd: Date;
  publishDate: Date;
  status: (typeof CYCLE_STATUS)[keyof typeof CYCLE_STATUS];
  description?: string;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cycleSchema = new Schema<ICycle>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    cycleNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    selfReviewStart: {
      type: Date,
      required: true,
    },
    selfReviewEnd: {
      type: Date,
      required: true,
    },
    seniorReviewStart: {
      type: Date,
      required: true,
    },
    seniorReviewEnd: {
      type: Date,
      required: true,
    },
    pmReviewStart: {
      type: Date,
      required: true,
    },
    pmReviewEnd: {
      type: Date,
      required: true,
    },
    gradeCalibrationStart: {
      type: Date,
      required: true,
    },
    gradeCalibrationEnd: {
      type: Date,
      required: true,
    },
    publishDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CYCLE_STATUS),
      default: CYCLE_STATUS.PLANNED,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

cycleSchema.index({ year: 1, cycleNumber: 1 }, { unique: true });

export const Cycle = mongoose.model<ICycle>('Cycle', cycleSchema);
