import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReviewFeedback extends Document {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  reviewerType: 'SELF' | 'SENIOR' | 'PM';
  reviewerId: Types.ObjectId;
  achievements?: string;
  strengths?: string;
  areasOfImprovement?: string;
  actionItems?: string;
  pmExceptionalContribution?: boolean;
  pmExceptionalContributionDetails?: string;
  seniorJustification?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewFeedbackSchema = new Schema<IReviewFeedback>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
    reviewerType: {
      type: String,
      enum: ['SELF', 'SENIOR', 'PM'],
      required: true,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievements: { type: String, trim: true },
    strengths: { type: String, trim: true },
    areasOfImprovement: { type: String, trim: true },
    actionItems: { type: String, trim: true },
    pmExceptionalContribution: { type: Boolean, default: false },
    pmExceptionalContributionDetails: { type: String, trim: true },
    seniorJustification: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

reviewFeedbackSchema.index({ reviewId: 1, reviewerType: 1 }, { unique: true });

export const ReviewFeedback = mongoose.model<IReviewFeedback>('ReviewFeedback', reviewFeedbackSchema);
