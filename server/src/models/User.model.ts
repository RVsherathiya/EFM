import mongoose, { Document, Schema, Types } from 'mongoose';
import { USER_ROLES, UserRole } from '../config/constants.js';

export interface IUser extends Document {
  _id: Types.ObjectId;
  employeeCode: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation: string;
  level: string; // L1 to L7
  departmentId?: Types.ObjectId;
  managerId?: Types.ObjectId;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  avatarUrl?: string;
  joinedDate?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Do not return passwordHash in standard queries
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
      default: 'L1',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    roles: {
      type: [String],
      enum: Object.values(USER_ROLES),
      default: [USER_ROLES.EMPLOYEE],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
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
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Compound indexes for high-frequency queries
userSchema.index({ departmentId: 1, status: 1 });
userSchema.index({ managerId: 1, status: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeCode: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
