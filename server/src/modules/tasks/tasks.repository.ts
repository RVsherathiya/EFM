import { Types, FilterQuery } from 'mongoose';
import { Task, ITask } from '../../models/Task.model.js';

export interface FindTasksParams {
  filter: FilterQuery<ITask>;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TasksRepository {
  public async findTasks({
    filter,
    page = 1,
    limit = 20,
    search,
    sortBy = 'workDate',
    sortOrder = 'desc',
  }: FindTasksParams) {
    const query: FilterQuery<ITask> = { ...filter, isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const maxLimit = Math.min(limit, 100);
    const skip = (page - 1) * maxLimit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('userId', 'firstName lastName email employeeCode')
        .populate('projectId', 'name projectCode type billingModel')
        .populate('approvedBy', 'firstName lastName')
        .populate('rejectedBy', 'firstName lastName')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(maxLimit)
        .lean(),
      Task.countDocuments(query),
    ]);

    return {
      tasks: tasks as unknown as ITask[],
      total,
      page,
      limit: maxLimit,
      totalPages: Math.ceil(total / maxLimit),
    };
  }

  public async findById(id: string | Types.ObjectId): Promise<ITask | null> {
    return Task.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'firstName lastName email employeeCode managerId')
      .populate('projectId', 'name projectCode type billingModel projectManagerId projectLeadId')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .lean() as unknown as ITask | null;
  }

  public async findForTimesheetMatrix(userId: string | Types.ObjectId, startDate: Date, endDate: Date) {
    return Task.find({
      userId,
      workDate: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    })
      .populate('projectId', 'name projectCode type billingModel')
      .sort({ workDate: 1, createdAt: 1 })
      .lean();
  }
}

export const tasksRepository = new TasksRepository();
