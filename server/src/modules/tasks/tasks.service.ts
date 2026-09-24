import { Types, FilterQuery } from 'mongoose';
import { Task, ITask } from '../../models/Task.model.js';
import { Project } from '../../models/Project.model.js';
import { PeriodLock } from '../../models/PeriodLock.model.js';
import { IUser } from '../../models/User.model.js';
import { tasksRepository } from './tasks.repository.js';
import { taskRules } from '../../domain/task-rules/task.rules.js';
import { hierarchyService } from '../../domain/hierarchy/hierarchy.service.js';
import { auditService } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { TASK_STATUS, TASK_CATEGORIES } from '../../config/constants.js';

export interface CreateTaskInput {
  projectId: string;
  workDate: string;
  title: string;
  description: string;
  category: (typeof TASK_CATEGORIES)[number];
  hours: number;
  dueDate?: string | null;
  billable?: boolean;
  submit?: boolean;
}

export class TasksService {
  public async getTasks(
    currentUser: IUser,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      projectId?: string;
      userId?: string;
      status?: string;
      category?: string;
      billable?: boolean;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');
    const isSenior = currentUser.roles.includes('SENIOR');
    const isPM = currentUser.roles.includes('PM');

    const filter: FilterQuery<ITask> = {};

    if (params.userId) {
      // If specifying a user ID, verify scope permission
      if (!isHR && currentUser._id.toString() !== params.userId) {
        const descendantIds = await hierarchyService.getDescendantUserIds(currentUser._id);
        const isSubordinate = descendantIds.some((d) => d.toString() === params.userId);
        if (!isSubordinate && !isPM) {
          throw AppError.forbidden('You do not have permission to view tasks for this user (BR-SCOPE).');
        }
      }
      filter.userId = new Types.ObjectId(params.userId);
    } else if (!isHR) {
      if (isSenior || isPM) {
        const descendantIds = await hierarchyService.getDescendantUserIds(currentUser._id);
        const managedProjects = await Project.find({
          $or: [{ projectManagerId: currentUser._id }, { projectLeadId: currentUser._id }],
          isDeleted: false,
        }).select('_id');
        const managedProjectIds = managedProjects.map((p) => p._id);

        filter.$or = [
          { userId: currentUser._id },
          { userId: { $in: descendantIds } },
          { projectId: { $in: managedProjectIds } },
        ];
      } else {
        // Default Employee: only own tasks
        filter.userId = currentUser._id;
      }
    }

    if (params.projectId) filter.projectId = new Types.ObjectId(params.projectId);
    if (params.status) filter.status = params.status;
    if (params.category) filter.category = params.category;
    if (params.billable !== undefined) filter.billable = params.billable;

    if (params.startDate || params.endDate) {
      filter.workDate = {};
      if (params.startDate) filter.workDate.$gte = new Date(params.startDate);
      if (params.endDate) filter.workDate.$lte = new Date(params.endDate);
    }

    return tasksRepository.findTasks({
      filter,
      page: params.page,
      limit: params.limit,
      search: params.search,
    });
  }

  public async getTimesheetMatrix(currentUser: IUser, startDateStr: string, endDateStr: string, targetUserId?: string) {
    const effectiveUserId = targetUserId && (currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN') || currentUser.roles.includes('SENIOR'))
      ? targetUserId
      : currentUser._id.toString();

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return tasksRepository.findForTimesheetMatrix(effectiveUserId, startDate, endDate);
  }

  public async createTask(input: CreateTaskInput, creatorUser: IUser): Promise<{ task: ITask; warning?: string }> {
    const workDate = new Date(input.workDate);

    // 1. Period Lock Check (BR-TASK-005)
    await taskRules.checkPeriodLock(workDate);

    // 2. Task Date Validation (BR-TASK-002)
    await taskRules.validateTaskDate(creatorUser._id, input.projectId, workDate);

    // 3. Daily Hours Validation (BR-TASK-001)
    const hoursResult = await taskRules.validateDailyHours(creatorUser._id, workDate, input.hours);

    // 4. Internal Project Rule (BR-PROJ-003): Internal project tasks are always Non-Billable
    const project = await Project.findById(input.projectId);
    const isInternal = project?.type === 'INTERNAL';
    const finalBillable = isInternal ? false : (input.billable ?? true);

    const status = input.submit ? TASK_STATUS.SUBMITTED : TASK_STATUS.DRAFT;
    const approvalStatus = input.submit ? 'PENDING' : 'PENDING';

    const task = await Task.create({
      userId: creatorUser._id,
      projectId: new Types.ObjectId(input.projectId),
      workDate,
      title: input.title,
      description: input.description,
      category: input.category,
      hours: input.hours,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      status,
      billable: finalBillable,
      approvalStatus,
    });

    await auditService.log({
      entity: 'TASK',
      entityId: task._id.toString(),
      action: input.submit ? 'TASK_SUBMITTED' : 'TASK_SAVED_DRAFT',
      userId: creatorUser._id,
      userName: `${creatorUser.firstName} ${creatorUser.lastName}`,
      userEmail: creatorUser.email,
      newValue: { title: task.title, hours: task.hours, status: task.status },
    });

    return { task, warning: hoursResult.warning };
  }

  public async updateTask(taskId: string, updates: Partial<CreateTaskInput>, currentUser: IUser): Promise<{ task: ITask; warning?: string }> {
    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    if (!task.userId.equals(currentUser._id) && !currentUser.roles.includes('HR_ADMIN') && !currentUser.roles.includes('SUPER_ADMIN')) {
      throw AppError.forbidden('You can only edit your own tasks.');
    }

    // BR-TASK-003: Approved tasks are read-only and immutable!
    if (task.status === TASK_STATUS.APPROVED) {
      throw AppError.badRequest('Approved tasks are immutable and cannot be edited (BR-TASK-003).');
    }

    const workDate = updates.workDate ? new Date(updates.workDate) : task.workDate;
    const hours = updates.hours !== undefined ? updates.hours : task.hours;
    const projectId = updates.projectId ? updates.projectId : task.projectId.toString();

    // Check Period Lock
    await taskRules.checkPeriodLock(workDate);

    // Validate Date & Bounds
    await taskRules.validateTaskDate(currentUser._id, projectId, workDate);

    // Validate Daily Hours
    const hoursResult = await taskRules.validateDailyHours(currentUser._id, workDate, hours, task._id);

    if (updates.title) task.title = updates.title;
    if (updates.description) task.description = updates.description;
    if (updates.category) task.category = updates.category;
    task.hours = hours;
    task.workDate = workDate;
    task.projectId = new Types.ObjectId(projectId);

    if (updates.submit) {
      task.status = TASK_STATUS.SUBMITTED;
      task.approvalStatus = 'PENDING';
      task.rejectedBy = undefined;
      task.rejectedAt = undefined;
      task.rejectionReason = undefined;
    }

    await task.save();

    await auditService.log({
      entity: 'TASK',
      entityId: task._id.toString(),
      action: updates.submit ? 'TASK_RESUBMITTED' : 'TASK_UPDATED',
      userId: currentUser._id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userEmail: currentUser.email,
    });

    return { task, warning: hoursResult.warning };
  }

  public async submitTasks(taskIds: string[], currentUser: IUser): Promise<void> {
    const tasks = await Task.find({
      _id: { $in: taskIds },
      userId: currentUser._id,
      status: { $in: [TASK_STATUS.DRAFT, TASK_STATUS.REJECTED] },
      isDeleted: false,
    });

    if (tasks.length === 0) {
      throw AppError.badRequest('No eligible draft or rejected tasks found for submission.');
    }

    for (const t of tasks) {
      await taskRules.checkPeriodLock(t.workDate);
      t.status = TASK_STATUS.SUBMITTED;
      t.approvalStatus = 'PENDING';
      t.rejectedBy = undefined;
      t.rejectedAt = undefined;
      t.rejectionReason = undefined;
      await t.save();
    }

    await auditService.log({
      entity: 'TASK',
      entityId: 'BULK_SUBMIT',
      action: 'TASKS_SUBMITTED',
      userId: currentUser._id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userEmail: currentUser.email,
      newValue: { count: tasks.length },
    });
  }

  public async approveTasks(
    taskIds: string[],
    action: 'APPROVE_BILLABLE' | 'APPROVE_NON_BILLABLE',
    approverUser: IUser
  ): Promise<{ approvedCount: number }> {
    const tasks = await Task.find({
      _id: { $in: taskIds },
      status: TASK_STATUS.SUBMITTED,
      isDeleted: false,
    }).populate('projectId');

    if (tasks.length === 0) {
      throw AppError.badRequest('No submitted tasks found to approve.');
    }

    const isHR = approverUser.roles.includes('HR_ADMIN') || approverUser.roles.includes('SUPER_ADMIN');
    const isSenior = approverUser.roles.includes('SENIOR');
    const isPM = approverUser.roles.includes('PM');

    const descendantIds = isSenior ? await hierarchyService.getDescendantUserIds(approverUser._id) : [];

    let count = 0;
    for (const task of tasks) {
      const isProjectInternal = (task.projectId as unknown as { type?: string })?.type === 'INTERNAL';
      const projectPMId = (task.projectId as unknown as { projectManagerId?: Types.ObjectId })?.projectManagerId?.toString();
      const projectLeadId = (task.projectId as unknown as { projectLeadId?: Types.ObjectId })?.projectLeadId?.toString();

      const canApproveAsPM = isPM && (projectPMId === approverUser._id.toString() || projectLeadId === approverUser._id.toString());
      const canApproveAsSenior = isSenior && descendantIds.some((d) => d.equals(task.userId));

      if (!isHR && !canApproveAsPM && !canApproveAsSenior) {
        throw AppError.forbidden(`You do not have approval authority over task: ${task.title} (BR-TASK-004).`);
      }

      task.status = TASK_STATUS.APPROVED;
      task.approvalStatus = action === 'APPROVE_BILLABLE' ? 'APPROVED_BILLABLE' : 'APPROVED_NON_BILLABLE';
      // Internal projects can NEVER be billable
      task.billable = isProjectInternal ? false : action === 'APPROVE_BILLABLE';
      task.approvedBy = approverUser._id;
      task.approvedAt = new Date();
      await task.save();
      count++;
    }

    await auditService.log({
      entity: 'TASK',
      entityId: 'BULK_APPROVE',
      action: 'TASKS_APPROVED',
      userId: approverUser._id,
      userName: `${approverUser.firstName} ${approverUser.lastName}`,
      userEmail: approverUser.email,
      newValue: { action, count },
    });

    return { approvedCount: count };
  }

  public async rejectTasks(
    taskIds: string[],
    reason: string,
    rejecterUser: IUser
  ): Promise<{ rejectedCount: number }> {
    const tasks = await Task.find({
      _id: { $in: taskIds },
      status: TASK_STATUS.SUBMITTED,
      isDeleted: false,
    }).populate('projectId');

    if (tasks.length === 0) {
      throw AppError.badRequest('No submitted tasks found to reject.');
    }

    const isHR = rejecterUser.roles.includes('HR_ADMIN') || rejecterUser.roles.includes('SUPER_ADMIN');
    const isSenior = rejecterUser.roles.includes('SENIOR');
    const isPM = rejecterUser.roles.includes('PM');

    const descendantIds = isSenior ? await hierarchyService.getDescendantUserIds(rejecterUser._id) : [];

    let count = 0;
    for (const task of tasks) {
      const projectPMId = (task.projectId as unknown as { projectManagerId?: Types.ObjectId })?.projectManagerId?.toString();
      const projectLeadId = (task.projectId as unknown as { projectLeadId?: Types.ObjectId })?.projectLeadId?.toString();

      const canActAsPM = isPM && (projectPMId === rejecterUser._id.toString() || projectLeadId === rejecterUser._id.toString());
      const canActAsSenior = isSenior && descendantIds.some((d) => d.equals(task.userId));

      if (!isHR && !canActAsPM && !canActAsSenior) {
        throw AppError.forbidden(`You do not have rejection authority over task: ${task.title} (BR-TASK-004).`);
      }

      task.status = TASK_STATUS.REJECTED;
      task.approvalStatus = 'REJECTED';
      task.rejectedBy = rejecterUser._id;
      task.rejectedAt = new Date();
      task.rejectionReason = reason;
      await task.save();
      count++;
    }

    await auditService.log({
      entity: 'TASK',
      entityId: 'BULK_REJECT',
      action: 'TASKS_REJECTED',
      userId: rejecterUser._id,
      userName: `${rejecterUser.firstName} ${rejecterUser.lastName}`,
      userEmail: rejecterUser.email,
      newValue: { reason, count },
    });

    return { rejectedCount: count };
  }

  public async unlockPeriod(yearMonth: string, reason: string, hrUser: IUser): Promise<void> {
    const existing = await PeriodLock.findOne({ yearMonth });
    if (existing) {
      existing.isLocked = false;
      existing.unlockedBy = hrUser._id;
      existing.unlockedAt = new Date();
      existing.unlockReason = reason;
      await existing.save();
    } else {
      await PeriodLock.create({
        yearMonth,
        isLocked: false,
        unlockedBy: hrUser._id,
        unlockedAt: new Date(),
        unlockReason: reason,
      });
    }

    await auditService.log({
      entity: 'PERIOD_LOCK',
      entityId: yearMonth,
      action: 'PERIOD_UNLOCKED',
      userId: hrUser._id,
      userName: `${hrUser.firstName} ${hrUser.lastName}`,
      userEmail: hrUser.email,
      newValue: { yearMonth, reason },
    });
  }

  public async getPeriodLocks() {
    return PeriodLock.find().populate('unlockedBy', 'firstName lastName email').sort({ yearMonth: -1 }).lean();
  }
}

export const tasksService = new TasksService();
