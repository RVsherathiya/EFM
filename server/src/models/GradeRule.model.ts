import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGradeRuleCondition {
  field: 'overallScore' | 'criterionScore' | 'missedDeadlines' | 'pmExceptionalContribution' | 'countCriteriaBelow' | 'qualityScore' | 'selfSubmitted' | 'seniorJustification';
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'ne' | 'allGte' | 'countLte';
  value: any;
  criterionName?: string; // If field is 'qualityScore' or 'criterionScore'
  thresholdScore?: number; // e.g. for countCriteriaBelow: thresholdScore = 3
}

export interface IGradeRule extends Document {
  _id: Types.ObjectId;
  cycleId?: Types.ObjectId; // null = global default template, set = cycle specific
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-';
  priority: number; // 1 = highest priority (A+), evaluated top to bottom
  minScore: number;
  maxScore: number;
  description: string;
  conditions: IGradeRuleCondition[];
  requiresHrApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gradeRuleConditionSchema = new Schema<IGradeRuleCondition>(
  {
    field: {
      type: String,
      required: true,
      enum: [
        'overallScore',
        'criterionScore',
        'missedDeadlines',
        'pmExceptionalContribution',
        'countCriteriaBelow',
        'qualityScore',
        'selfSubmitted',
        'seniorJustification',
      ],
    },
    operator: {
      type: String,
      required: true,
      enum: ['gte', 'lte', 'gt', 'lt', 'eq', 'ne', 'allGte', 'countLte'],
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    criterionName: {
      type: String,
    },
    thresholdScore: {
      type: Number,
    },
  },
  { _id: false }
);

const gradeRuleSchema = new Schema<IGradeRule>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'Cycle',
      index: true,
    },
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'],
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      index: true,
    },
    minScore: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    conditions: [gradeRuleConditionSchema],
    requiresHrApproval: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

gradeRuleSchema.index({ cycleId: 1, priority: 1 });

export const GradeRule = mongoose.model<IGradeRule>('GradeRule', gradeRuleSchema);
