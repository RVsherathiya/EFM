import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOverride extends Document {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  originalGrade: string;
  originalScore: number;
  overriddenGrade: string;
  overriddenScore?: number;
  reason: string; // Mandatory reason (BR-GRADE-005)
  overriddenBy: Types.ObjectId;
  createdAt: Date;
}

const overrideSchema = new Schema<IOverride>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
    originalGrade: {
      type: String,
      required: true,
    },
    originalScore: {
      type: Number,
      required: true,
    },
    overriddenGrade: {
      type: String,
      required: true,
    },
    overriddenScore: {
      type: Number,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    overriddenBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

overrideSchema.index({ reviewId: 1, createdAt: -1 });

export const Override = mongoose.model<IOverride>('Override', overrideSchema);
