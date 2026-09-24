import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'REVIEW_OPEN'
  | 'REVIEW_REMINDER'
  | 'REVIEW_OVERDUE'
  | 'TASK_REMINDER'
  | 'TASK_APPROVAL_PENDING'
  | 'CYCLE_PUBLISHED'
  | 'REVIEW_PUBLISHED'
  | 'DISPUTE_CREATED'
  | 'DELEGATION_CREATED'
  | 'PROJECT_ASSIGNMENT'
  | 'DOCUMENT_UPLOADED';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'REVIEW_OPEN',
        'REVIEW_REMINDER',
        'REVIEW_OVERDUE',
        'TASK_REMINDER',
        'TASK_APPROVAL_PENDING',
        'CYCLE_PUBLISHED',
        'REVIEW_PUBLISHED',
        'DISPUTE_CREATED',
        'DELEGATION_CREATED',
        'PROJECT_ASSIGNMENT',
        'DOCUMENT_UPLOADED',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
