import { Task } from '../../models/Task.model.js';
import { Types } from 'mongoose';

export interface TimesheetFilterParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  employeeId?: string;
  departmentId?: string;
  category?: string;
  billable?: boolean;
  status?: string;
  allowedUserIds?: Types.ObjectId[];
  isGlobalScope?: boolean;
}

export class ReportsService {
  /**
   * Helper to build base query for tasks within scope and filters
   */
  private buildBaseTaskQuery(params: TimesheetFilterParams) {
    const query: any = {};

    if (params.startDate || params.endDate) {
      const dateFilter: any = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.$or = [{ workDate: dateFilter }, { taskDate: dateFilter }];
    }

    if (params.projectId) query.projectId = new Types.ObjectId(params.projectId);
    if (params.employeeId) query.userId = new Types.ObjectId(params.employeeId);
    if (params.category) query.category = params.category;
    if (params.billable !== undefined) {
      query.$or = [{ billable: params.billable }, { isBillable: params.billable }];
    }
    if (params.status) query.status = params.status;

    // Server-side visibility scope constraint
    if (!params.isGlobalScope && params.allowedUserIds && params.allowedUserIds.length > 0) {
      if (query.userId) {
        const isAllowed = params.allowedUserIds.some((id) => id.toString() === query.userId.toString());
        if (!isAllowed) {
          query.userId = { $in: [] }; // Yield empty
        }
      } else {
        query.userId = { $in: params.allowedUserIds };
      }
    }

    return query;
  }

  /**
   * Detailed timesheet report with pagination
   */
  async getTimesheetReport(params: TimesheetFilterParams & { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const query = this.buildBaseTaskQuery(params);

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('userId', 'firstName lastName email employeeCode')
        .populate('projectId', 'name projectCode')
        .sort({ workDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Project effort summary (total hours, billable vs non-billable, member effort)
   */
  async getProjectEffortReport(params: TimesheetFilterParams) {
    const matchQuery = this.buildBaseTaskQuery(params);

    const projectAgg = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$projectId',
          totalHours: { $sum: '$hours' },
          billableHours: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$billable', true] },
                    { $eq: ['$isBillable', true] },
                  ],
                },
                '$hours',
                0,
              ],
            },
          },
          nonBillableHours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$billable', true] },
                    { $ne: ['$isBillable', true] },
                  ],
                },
                '$hours',
                0,
              ],
            },
          },
          taskCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },
      {
        $project: {
          _id: 1,
          projectName: '$project.name',
          projectCode: '$project.projectCode',
          totalHours: 1,
          billableHours: 1,
          nonBillableHours: 1,
          billablePercentage: {
            $cond: [
              { $gt: ['$totalHours', 0] },
              { $multiply: [{ $divide: ['$billableHours', '$totalHours'] }, 100] },
              0,
            ],
          },
          taskCount: 1,
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    return projectAgg;
  }

  /**
   * Employee utilisation report:
   * BR-REPORT-002: Utilisation = (billable hours / (working days * 8)) * 100
   */
  async getUtilisationReport(params: TimesheetFilterParams & { workingDays?: number }) {
    const matchQuery = this.buildBaseTaskQuery(params);
    const workingDays = params.workingDays || 22; // default standard month
    const totalWorkingHours = workingDays * 8;

    const utilisationAgg = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$userId',
          totalLoggedHours: { $sum: '$hours' },
          billableHours: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$billable', true] },
                    { $eq: ['$isBillable', true] },
                  ],
                },
                '$hours',
                0,
              ],
            },
          },
          approvedHours: {
            $sum: {
              $cond: [{ $eq: ['$status', 'APPROVED'] }, '$hours', 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          employeeName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          employeeCode: '$user.employeeCode',
          designation: '$user.designation',
          totalLoggedHours: 1,
          billableHours: 1,
          approvedHours: 1,
          workingCapacityHours: { $literal: totalWorkingHours },
          utilisationPct: {
            $multiply: [{ $divide: ['$billableHours', totalWorkingHours] }, 100],
          },
        },
      },
      { $sort: { utilisationPct: -1 } },
    ]);

    return utilisationAgg;
  }

  /**
   * Task Category breakdown
   */
  async getCategoryBreakdown(params: TimesheetFilterParams) {
    const matchQuery = this.buildBaseTaskQuery(params);

    const categoryAgg = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          totalHours: { $sum: '$hours' },
          taskCount: { $sum: 1 },
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    return categoryAgg;
  }

  /**
   * High-level Billable Summary
   */
  async getBillableSummary(params: TimesheetFilterParams) {
    const matchQuery = this.buildBaseTaskQuery(params);

    const summary = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hours' },
          billableHours: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$billable', true] },
                    { $eq: ['$isBillable', true] },
                  ],
                },
                '$hours',
                0,
              ],
            },
          },
          nonBillableHours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$billable', true] },
                    { $ne: ['$isBillable', true] },
                  ],
                },
                '$hours',
                0,
              ],
            },
          },
          approvedHours: {
            $sum: {
              $cond: [{ $eq: ['$status', 'APPROVED'] }, '$hours', 0],
            },
          },
          pendingHours: {
            $sum: {
              $cond: [{ $eq: ['$status', 'SUBMITTED'] }, '$hours', 0],
            },
          },
          totalTasks: { $sum: 1 },
        },
      },
    ]);

    const res = summary[0] || {
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      approvedHours: 0,
      pendingHours: 0,
      totalTasks: 0,
    };

    const billablePercentage = res.totalHours > 0 ? (res.billableHours / res.totalHours) * 100 : 0;

    return {
      ...res,
      billablePercentage,
    };
  }
}

export const reportsService = new ReportsService();
