import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IScoreDefinition {
  score: number; // 1 to 5
  label: string; // e.g. "Below Expectations", "Meets Expectations"
  description: string;
}

export interface ICriterion extends Document {
  _id: Types.ObjectId;
  cycleId?: Types.ObjectId; // If null, global template; if set, snapshot for cycle
  name: string;
  description: string;
  weight: number; // Percentage e.g. 25
  sortOrder: number;
  scoreDefinitions: IScoreDefinition[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scoreDefinitionSchema = new Schema<IScoreDefinition>(
  {
    score: { type: Number, required: true, min: 1, max: 5 },
    label: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const criterionSchema = new Schema<ICriterion>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'Cycle',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    sortOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    scoreDefinitions: {
      type: [scoreDefinitionSchema],
      default: [
        { score: 1, label: 'Below', description: 'Consistently fails to meet acceptable performance standards' },
        { score: 2, label: 'Partially Meets', description: 'Occasionally meets standards but lacks consistency' },
        { score: 3, label: 'Meets', description: 'Consistently meets performance goals and expectations' },
        { score: 4, label: 'Exceeds', description: 'Frequently exceeds established expectations and targets' },
        { score: 5, label: 'Outstanding', description: 'Significantly and consistently outperforms across all domains' },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

criterionSchema.index({ cycleId: 1, sortOrder: 1 });

export const Criterion = mongoose.model<ICriterion>('Criterion', criterionSchema);
