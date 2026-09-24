import { Types } from 'mongoose';
import { Project } from '../../models/Project.model.js';
import { ProjectMember } from '../../models/ProjectMember.model.js';
import { PeriodLock } from '../../models/PeriodLock.model.js';
import { Task } from '../../models/Task.model.js';
import { AppError } from '../../utils/app-error.js';

export class TaskRules {
  /**
   * Validates task date bounds (BR-TASK-002):
   * 1. Cannot be in the future
   * 2. Cannot precede project start date
   * 3. Cannot precede employee's assignment start date
   */
  public async validateTaskDate(
    userId: string | Types.ObjectId,
    projectId: string | Types.ObjectId,
    workDate: Date
  ): Promise<void> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (workDate > today) {
      throw AppError.badRequest('Task date cannot be in the future (BR-TASK-002).');
    }

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    if (project.status !== 'ACTIVE') {
      throw AppError.badRequest('Tasks can only be logged against ACTIVE projects (BR-PROJ-002).');
    }

    const projectStartDate = new Date(project.startDate);
    projectStartDate.setHours(0, 0, 0, 0);

    const taskDateOnly = new Date(workDate);
    taskDateOnly.setHours(0, 0, 0, 0);

    if (taskDateOnly < projectStartDate) {
      throw AppError.badRequest(
        `Task date (${taskDateOnly.toISOString().split('T')[0]}) cannot precede project start date (${projectStartDate.toISOString().split('T')[0]}) (BR-TASK-002).`
      );
    }

    const membership = await ProjectMember.findOne({
      projectId,
      userId,
      isDeleted: false,
    });

    if (!membership) {
      throw AppError.forbidden('You are not assigned as a member of this project.');
    }

    const memberStartDate = new Date(membership.startDate);
    memberStartDate.setHours(0, 0, 0, 0);

    if (taskDateOnly < memberStartDate) {
      throw AppError.badRequest(
        `Task date cannot precede your project assignment start date (${memberStartDate.toISOString().split('T')[0]}) (BR-TASK-002).`
      );
    }

    if (membership.endDate) {
      const memberEndDate = new Date(membership.endDate);
      memberEndDate.setHours(23, 59, 59, 999);
      if (workDate > memberEndDate) {
        throw AppError.badRequest('Task date is after your project assignment ended.');
      }
    }
  }

  /**
   * Validates hours: 0.25 increment, daily max 24 hours (BR-TASK-001)
   */
  public async validateDailyHours(
    userId: string | Types.ObjectId,
    workDate: Date,
    newHours: number,
    excludeTaskId?: string | Types.ObjectId
  ): Promise<{ dailyTotal: number; warning?: string }> {
    // 1. Check 0.25 increment
    if (newHours <= 0 || (newHours * 100) % 25 !== 0) {
      throw AppError.badRequest('Task hours must be in 0.25 increments (e.g. 0.5, 1.25, 2.75) (BR-TASK-001).');
    }

    // 2. Query total hours logged by user on this day
    const startOfDay = new Date(workDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(workDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      userId,
      workDate: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    };

    if (excludeTaskId) {
      query._id = { $ne: new Types.ObjectId(excludeTaskId.toString()) };
    }

    const existingTasks = await Task.find(query).select('hours').lean();
    const existingTotal = existingTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
    const dailyTotal = existingTotal + newHours;

    if (dailyTotal > 24) {
      throw AppError.badRequest(
        `Daily hours limit exceeded. Logging ${newHours}h would bring daily total to ${dailyTotal}h (Maximum allowed: 24h/day) (BR-TASK-001).`
      );
    }

    let warning: string | undefined;
    if (dailyTotal > 12) {
      warning = `Note: Logged hours for ${startOfDay.toISOString().split('T')[0]} exceed 12 hours (${dailyTotal}h total).`;
    }

    return { dailyTotal, warning };
  }

  /**
   * Checks Period Lock (BR-TASK-005):
   * Auto-locks after 5th of next month unless explicitly unlocked by HR.
   */
  public async checkPeriodLock(workDate: Date): Promise<void> {
    const d = new Date(workDate);
    const yearMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;

    // Check if period lock document explicitly exists
    const lockDoc = await PeriodLock.findOne({ yearMonth });
    if (lockDoc) {
      if (lockDoc.isLocked) {
        throw AppError.forbidden(
          `Timesheet period ${yearMonth} is locked (BR-TASK-005). Contact HR to request a period unlock.`
        );
      }
      return; // Explicitly unlocked by HR
    }

    // Default rule: If past 5th of the following month, period is automatically locked
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const taskYear = d.getFullYear();
    const taskMonth = d.getMonth();

    const monthDiff = (currentYear - taskYear) * 12 + (currentMonth - taskMonth);

    if (monthDiff > 1 || (monthDiff === 1 && now.getDate() > 5)) {
      throw AppError.forbidden(
        `Timesheet period ${yearMonth} has automatically locked after the 5th of the month (BR-TASK-005). Contact HR to unlock.`
      );
    }
  }
}

export const taskRules = new TaskRules();
