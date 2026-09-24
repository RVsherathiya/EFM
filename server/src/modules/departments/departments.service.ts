import { Types } from 'mongoose';
import { Department, IDepartment } from '../../models/Department.model.js';
import { auditService } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { IUser } from '../../models/User.model.js';

export class DepartmentsService {
  public async getDepartments() {
    return Department.find({ isDeleted: false })
      .populate('headId', 'firstName lastName email employeeCode')
      .sort({ name: 1 })
      .lean();
  }

  public async getDepartmentById(id: string) {
    const dept = await Department.findOne({ _id: id, isDeleted: false })
      .populate('headId', 'firstName lastName email employeeCode')
      .lean();
    if (!dept) {
      throw AppError.notFound('Department not found.');
    }
    return dept;
  }

  public async createDepartment(data: { name: string; code: string; headId?: string | null; description?: string }, creatorUser: IUser): Promise<IDepartment> {
    const existingCode = await Department.findOne({ code: data.code.toUpperCase(), isDeleted: false });
    if (existingCode) {
      throw AppError.conflict('A department with this code already exists.');
    }

    const existingName = await Department.findOne({ name: data.name, isDeleted: false });
    if (existingName) {
      throw AppError.conflict('A department with this name already exists.');
    }

    const dept = await Department.create({
      name: data.name,
      code: data.code.toUpperCase(),
      headId: data.headId ? new Types.ObjectId(data.headId) : undefined,
      description: data.description,
    });

    await auditService.log({
      entity: 'DEPARTMENT',
      entityId: dept._id.toString(),
      action: 'CREATE',
      userId: creatorUser._id,
      userName: `${creatorUser.firstName} ${creatorUser.lastName}`,
      userEmail: creatorUser.email,
      newValue: { name: dept.name, code: dept.code },
    });

    return dept;
  }

  public async updateDepartment(
    id: string,
    updates: { name?: string; code?: string; headId?: string | null; description?: string; status?: 'ACTIVE' | 'INACTIVE' },
    updaterUser: IUser
  ): Promise<IDepartment> {
    const dept = await Department.findOne({ _id: id, isDeleted: false });
    if (!dept) {
      throw AppError.notFound('Department not found.');
    }

    if (updates.name !== undefined) dept.name = updates.name;
    if (updates.code !== undefined) dept.code = updates.code;
    if (updates.description !== undefined) dept.description = updates.description;
    if (updates.status !== undefined) dept.status = updates.status;
    if (updates.headId !== undefined) {
      dept.headId = updates.headId ? new Types.ObjectId(updates.headId) : undefined;
    }

    await dept.save();

    await auditService.log({
      entity: 'DEPARTMENT',
      entityId: dept._id.toString(),
      action: 'UPDATE',
      userId: updaterUser._id,
      userName: `${updaterUser.firstName} ${updaterUser.lastName}`,
      userEmail: updaterUser.email,
      newValue: updates as Record<string, unknown>,
    });

    return dept;
  }
}

export const departmentsService = new DepartmentsService();
