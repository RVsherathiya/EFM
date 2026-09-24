import mongoose, { Document, Schema, Types } from 'mongoose';
import { DOCUMENT_CATEGORIES } from '../config/constants.js';

export interface IProjectDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  category: (typeof DOCUMENT_CATEGORIES)[number];
  description?: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  storageKey: string;
  version: number;
  uploadedBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectDocumentSchema = new Schema<IProjectDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      default: 'Technical',
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

projectDocumentSchema.index({ projectId: 1, title: 1, version: -1 });

export const ProjectDocument = mongoose.model<IProjectDocument>('ProjectDocument', projectDocumentSchema);
