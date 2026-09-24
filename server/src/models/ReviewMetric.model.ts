import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReviewMetric extends Document {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  totalLoggedHours: number;
  totalApprovedHours: number;
  billableHours: number;
  billablePercentage: number;
  tasksCompleted: number;
  missedDeadlines: number;
  hoursByCategory: Record<string, number>;
  hoursByProject: Array<{ projectId: Types.ObjectId; projectName: string; hours: number }>;
  calculatedAt: Date;
}

const reviewMetricSchema = new Schema<IReviewMetric>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      unique: true,
      index: true,
    },
    totalLoggedHours: { type: Number, default: 0 },
    totalApprovedHours: { type: Number, default: 0 },
    billableHours: { type: Number, default: 0 },
    billablePercentage: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    missedDeadlines: { type: Number, default: 0 },
    hoursByCategory: { type: Schema.Types.Mixed, default: {} },
    hoursByProject: [
      {
        projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
        projectName: String,
        hours: Number,
      },
    ],
    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const ReviewMetric = mongoose.model<IReviewMetric>('ReviewMetric', reviewMetricSchema);
