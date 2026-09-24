import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReviewRating extends Document {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  criterionId: Types.ObjectId;
  reviewerType: 'SELF' | 'SENIOR' | 'PM';
  reviewerId: Types.ObjectId;
  score: number; // 1 to 5
  comment: string; // Mandatory if score is 1, 2, or 5 (BR-REVIEW-004)
  createdAt: Date;
  updatedAt: Date;
}

const reviewRatingSchema = new Schema<IReviewRating>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
    criterionId: {
      type: Schema.Types.ObjectId,
      ref: 'Criterion',
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
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewRatingSchema.index({ reviewId: 1, criterionId: 1, reviewerType: 1 }, { unique: true });

export const ReviewRating = mongoose.model<IReviewRating>('ReviewRating', reviewRatingSchema);
