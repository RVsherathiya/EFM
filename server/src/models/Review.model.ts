import mongoose, { Document, Schema, Types } from 'mongoose';
import { REVIEW_STATUS } from '../config/constants.js';

export interface IReview extends Document {
  _id: Types.ObjectId;
  cycleId: Types.ObjectId;
  employeeId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  seniorId: Types.ObjectId; // Snapshot of manager when review opened
  pmId?: Types.ObjectId; // Assigned PM reviewer
  status: (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
  selfSubmittedAt?: Date;
  seniorSubmittedAt?: Date;
  pmSubmittedAt?: Date;
  pmSendBackCount: number; // Max 1
  pmSendBackReason?: string;
  gradeCalculatedAt?: Date;
  finalScore?: number;
  calculatedGrade?: string;
  matchedRuleId?: Types.ObjectId;
  publishedAt?: Date;
  acknowledgedAt?: Date;
  employeeComments?: string;
  isDisputed: boolean;
  disputeReason?: string;
  disputedAt?: Date;
  disputeResolvedAt?: Date;
  disputeResolutionNotes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'Cycle',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    seniorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pmId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.DRAFT,
      index: true,
    },
    selfSubmittedAt: { type: Date },
    seniorSubmittedAt: { type: Date },
    pmSubmittedAt: { type: Date },
    pmSendBackCount: { type: Number, default: 0 },
    pmSendBackReason: { type: String, trim: true },
    gradeCalculatedAt: { type: Date },
    finalScore: { type: Number },
    calculatedGrade: { type: String },
    matchedRuleId: { type: Schema.Types.ObjectId, ref: 'GradeRule' },
    publishedAt: { type: Date },
    acknowledgedAt: { type: Date },
    employeeComments: { type: String, trim: true },
    isDisputed: { type: Boolean, default: false, index: true },
    disputeReason: { type: String, trim: true },
    disputedAt: { type: Date },
    disputeResolvedAt: { type: Date },
    disputeResolutionNotes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });
reviewSchema.index({ seniorId: 1, status: 1 });
reviewSchema.index({ pmId: 1, status: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
