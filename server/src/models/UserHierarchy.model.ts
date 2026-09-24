import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserHierarchy extends Document {
  _id: Types.ObjectId;
  ancestorId: Types.ObjectId;
  descendantId: Types.ObjectId;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

const userHierarchySchema = new Schema<IUserHierarchy>(
  {
    ancestorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    descendantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    depth: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate relations
userHierarchySchema.index({ ancestorId: 1, descendantId: 1 }, { unique: true });
userHierarchySchema.index({ descendantId: 1, depth: 1 });

export const UserHierarchy = mongoose.model<IUserHierarchy>('UserHierarchy', userHierarchySchema);
