import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProjectMember extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  projectRole: string; // e.g. 'Lead Developer', 'UI Designer', 'QA Engineer'
  allocationPct: number; // 0 - 100%
  defaultBillable: boolean;
  startDate: Date;
  endDate?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectRole: {
      type: String,
      required: true,
      trim: true,
      default: 'Team Member',
    },
    allocationPct: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    defaultBillable: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
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

projectMemberSchema.index({ projectId: 1, userId: 1 });
projectMemberSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const ProjectMember = mongoose.model<IProjectMember>('ProjectMember', projectMemberSchema);
