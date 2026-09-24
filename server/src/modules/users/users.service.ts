import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, IUser } from '../../models/User.model.js';
import { Department } from '../../models/Department.model.js';
import { usersRepository, FindUsersParams } from './users.repository.js';
import { hierarchyService } from '../../domain/hierarchy/hierarchy.service.js';
import { auditService } from '../../services/audit.service.js';
import { scopeService } from '../../services/scope.service.js';
import { AppError } from '../../utils/app-error.js';
import { UserRole } from '../../config/constants.js';

export interface CreateUserData {
  employeeCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  designation: string;
  level: string;
  departmentId?: string;
  managerId?: string | null;
  roles: UserRole[];
  phone?: string;
}

export class UsersService {
  public async getUsers(currentUser: IUser, params: Omit<FindUsersParams, 'filter'> & { departmentId?: string; role?: string }) {
    const scopeFilter = await scopeService.buildUserQueryScope(currentUser);
    const combinedFilter = { ...scopeFilter };

    if (params.departmentId) {
      combinedFilter.departmentId = new Types.ObjectId(params.departmentId);
    }

    if (params.role) {
      combinedFilter.roles = params.role;
    }

    return usersRepository.findUsers({
      filter: combinedFilter,
      page: params.page,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
  }

  public async getUserById(currentUser: IUser, targetUserId: string) {
    await scopeService.enforceCanViewEmployee(currentUser, targetUserId);
    const user = await usersRepository.findById(targetUserId);
    if (!user) {
      throw AppError.notFound('Employee not found.');
    }
    return user;
  }

  public async createUser(data: CreateUserData, creatorUser: IUser): Promise<IUser> {
    // 1. Check duplicate email / employeeCode
    const existingEmail = await usersRepository.findByEmail(data.email);
    if (existingEmail) {
      throw AppError.conflict('An employee with this email address already exists.');
    }

    const existingCode = await usersRepository.findByEmployeeCode(data.employeeCode);
    if (existingCode) {
      throw AppError.conflict('An employee with this employee code already exists.');
    }

    // 2. Validate Manager if provided
    if (data.managerId) {
      const manager = await User.findOne({ _id: data.managerId, isDeleted: false });
      if (!manager) {
        throw AppError.badRequest('Specified manager does not exist or is inactive.');
      }
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4. Create User
    const newUser = await User.create({
      employeeCode: data.employeeCode,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      designation: data.designation,
      level: data.level,
      departmentId: data.departmentId ? new Types.ObjectId(data.departmentId) : undefined,
      managerId: data.managerId ? new Types.ObjectId(data.managerId) : undefined,
      roles: data.roles,
      phone: data.phone,
    });

    // 5. Rebuild Hierarchy Closure Tree
    await hierarchyService.rebuildHierarchyTree();

    // 6. Audit
    await auditService.log({
      entity: 'USER',
      entityId: newUser._id.toString(),
      action: 'CREATE',
      userId: creatorUser._id,
      userName: `${creatorUser.firstName} ${creatorUser.lastName}`,
      userEmail: creatorUser.email,
      newValue: {
        employeeCode: newUser.employeeCode,
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
        roles: newUser.roles,
      },
    });

    return newUser;
  }

  public async updateUser(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      designation?: string;
      level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
      departmentId?: string | null;
      roles?: UserRole[];
      status?: 'ACTIVE' | 'INACTIVE';
      phone?: string;
    },
    updaterUser: IUser
  ): Promise<IUser> {
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      throw AppError.notFound('Employee not found.');
    }

    const oldValue = {
      firstName: user.firstName,
      lastName: user.lastName,
      designation: user.designation,
      level: user.level,
      departmentId: user.departmentId,
      roles: user.roles,
      status: user.status,
    };

    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.designation !== undefined) user.designation = updates.designation;
    if (updates.level !== undefined) user.level = updates.level;
    if (updates.roles !== undefined) user.roles = updates.roles;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.departmentId !== undefined) {
      user.departmentId = updates.departmentId ? new Types.ObjectId(updates.departmentId) : undefined;
    }

    await user.save();

    await auditService.log({
      entity: 'USER',
      entityId: user._id.toString(),
      action: 'UPDATE',
      userId: updaterUser._id,
      userName: `${updaterUser.firstName} ${updaterUser.lastName}`,
      userEmail: updaterUser.email,
      oldValue,
      newValue: updates as Record<string, unknown>,
    });

    return user;
  }

  public async updateManager(userId: string, newManagerId: string | null, reason: string, updaterUser: IUser): Promise<void> {
    await hierarchyService.updateManager(userId, newManagerId, updaterUser._id, reason);

    await auditService.log({
      entity: 'USER',
      entityId: userId,
      action: 'MANAGER_CHANGE',
      userId: updaterUser._id,
      userName: `${updaterUser.firstName} ${updaterUser.lastName}`,
      userEmail: updaterUser.email,
      newValue: { managerId: newManagerId, reason },
    });
  }

  public async importUsers(
    rows: Array<{
      employeeCode: string;
      email: string;
      firstName: string;
      lastName: string;
      designation: string;
      level: string;
      departmentCode?: string;
      managerCode?: string;
      roles?: string;
    }>,
    commit: boolean,
    importerUser: IUser
  ) {
    const errors: Array<{ row: number; employeeCode: string; message: string }> = [];
    const validRows: Array<{
      employeeCode: string;
      email: string;
      firstName: string;
      lastName: string;
      designation: string;
      level: string;
      departmentId?: Types.ObjectId;
      managerCode?: string;
      roles: UserRole[];
    }> = [];

    // Pre-fetch departments
    const departments = await Department.find({ isDeleted: false });
    const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), d._id]));

    // Pre-fetch existing users to check uniqueness
    const existingUsers = await User.find({ isDeleted: false }).select('email employeeCode');
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingCodes = new Set(existingUsers.map((u) => u.employeeCode.toUpperCase()));

    const seenEmailsInFile = new Set<string>();
    const seenCodesInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const email = row.email?.trim().toLowerCase();
      const code = row.employeeCode?.trim().toUpperCase();

      if (!email || !code || !row.firstName || !row.lastName || !row.designation) {
        errors.push({ row: rowNum, employeeCode: code || 'UNKNOWN', message: 'Missing mandatory fields' });
        continue;
      }

      if (existingEmails.has(email) || seenEmailsInFile.has(email)) {
        errors.push({ row: rowNum, employeeCode: code, message: `Duplicate email: ${email}` });
        continue;
      }

      if (existingCodes.has(code) || seenCodesInFile.has(code)) {
        errors.push({ row: rowNum, employeeCode: code, message: `Duplicate employee code: ${code}` });
        continue;
      }

      const validLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
      const level = (row.level?.trim().toUpperCase() || 'L1');
      if (!validLevels.includes(level)) {
        errors.push({ row: rowNum, employeeCode: code, message: `Invalid level: ${level}. Must be L1-L7` });
        continue;
      }

      let departmentId: Types.ObjectId | undefined;
      if (row.departmentCode) {
        const dId = deptMap.get(row.departmentCode.trim().toUpperCase());
        if (!dId) {
          errors.push({ row: rowNum, employeeCode: code, message: `Department code not found: ${row.departmentCode}` });
          continue;
        }
        departmentId = dId;
      }

      const parsedRoles: UserRole[] = [];
      if (row.roles) {
        const rList = row.roles.split(',').map((r) => r.trim().toUpperCase());
        for (const r of rList) {
          if (['EMPLOYEE', 'SENIOR', 'PM', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r)) {
            parsedRoles.push(r as UserRole);
          }
        }
      }
      if (parsedRoles.length === 0) parsedRoles.push('EMPLOYEE');

      seenEmailsInFile.add(email);
      seenCodesInFile.add(code);

      validRows.push({
        employeeCode: code,
        email,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        designation: row.designation.trim(),
        level,
        departmentId,
        managerCode: row.managerCode?.trim().toUpperCase(),
        roles: parsedRoles,
      });
    }

    if (!commit) {
      return {
        totalRows: rows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
        preview: validRows.slice(0, 10),
      };
    }

    if (errors.length > 0) {
      throw AppError.badRequest('Import failed validation. Fix errors before committing.', errors);
    }

    // Pass 1: Insert users with default password
    const defaultPasswordHash = await bcrypt.hash('Welcome@123', 10);
    const codeToIdMap = new Map<string, Types.ObjectId>();
    for (const u of existingUsers) {
      codeToIdMap.set(u.employeeCode.toUpperCase(), u._id);
    }

    const createdUsers = await User.insertMany(
      validRows.map((r) => ({
        employeeCode: r.employeeCode,
        email: r.email,
        passwordHash: defaultPasswordHash,
        firstName: r.firstName,
        lastName: r.lastName,
        designation: r.designation,
        level: r.level,
        departmentId: r.departmentId,
        roles: r.roles,
        status: 'ACTIVE',
      }))
    );

    for (const cu of createdUsers) {
      codeToIdMap.set(cu.employeeCode.toUpperCase(), cu._id);
    }

    // Pass 2: Link managers
    for (const r of validRows) {
      if (r.managerCode) {
        const managerId = codeToIdMap.get(r.managerCode);
        const userId = codeToIdMap.get(r.employeeCode);
        if (managerId && userId && !managerId.equals(userId)) {
          await User.updateOne({ _id: userId }, { managerId });
        }
      }
    }

    // Rebuild full hierarchy closure table
    await hierarchyService.rebuildHierarchyTree();

    await auditService.log({
      entity: 'USER',
      entityId: 'BULK_IMPORT',
      action: 'IMPORT',
      userId: importerUser._id,
      userName: `${importerUser.firstName} ${importerUser.lastName}`,
      userEmail: importerUser.email,
      newValue: { importedCount: createdUsers.length },
    });

    return {
      success: true,
      importedCount: createdUsers.length,
    };
  }
}

export const usersService = new UsersService();
