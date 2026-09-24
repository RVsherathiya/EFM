import { reportsService, TimesheetFilterParams } from '../reports/reports.service.js';

export class ExportsService {
  /**
   * Generates CSV for Timesheet Reports
   */
  async exportTimesheetCsv(params: TimesheetFilterParams): Promise<string> {
    const reportData = await reportsService.getTimesheetReport({ ...params, page: 1, limit: 10000 });
    const tasks = reportData.tasks as any[];

    const headers = [
      'Task ID',
      'Employee Code',
      'Employee Name',
      'Project Code',
      'Project Name',
      'Task Date',
      'Category',
      'Hours',
      'Billable',
      'Approval Status',
      'Task Title',
      'Description',
    ];

    const rows = tasks.map((t) => [
      t._id.toString(),
      `"${t.userId?.employeeCode || ''}"`,
      `"${t.userId?.firstName || ''} ${t.userId?.lastName || ''}"`,
      `"${t.projectId?.projectCode || ''}"`,
      `"${t.projectId?.name || ''}"`,
      t.taskDate ? new Date(t.taskDate).toISOString().split('T')[0] : '',
      `"${t.category || ''}"`,
      t.hours,
      t.isBillable ? 'Yes' : 'No',
      t.status,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }

  /**
   * Generates CSV for Project Effort Reports
   */
  async exportProjectEffortCsv(params: TimesheetFilterParams): Promise<string> {
    const efforts = await reportsService.getProjectEffortReport(params);

    const headers = [
      'Project Code',
      'Project Name',
      'Total Hours',
      'Billable Hours',
      'Non-Billable Hours',
      'Billable Percentage (%)',
      'Total Tasks Logged',
    ];

    const rows = efforts.map((e) => [
      `"${e.projectCode}"`,
      `"${e.projectName}"`,
      e.totalHours,
      e.billableHours,
      e.nonBillableHours,
      e.billablePercentage ? e.billablePercentage.toFixed(2) : '0.00',
      e.taskCount,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates CSV for Utilisation Reports
   */
  async exportUtilisationCsv(params: TimesheetFilterParams): Promise<string> {
    const utilisations = await reportsService.getUtilisationReport(params);

    const headers = [
      'Employee Code',
      'Employee Name',
      'Designation',
      'Total Logged Hours',
      'Billable Hours',
      'Approved Hours',
      'Capacity (Hours)',
      'Utilisation (%)',
    ];

    const rows = utilisations.map((u) => [
      `"${u.employeeCode}"`,
      `"${u.employeeName}"`,
      `"${u.designation}"`,
      u.totalLoggedHours,
      u.billableHours,
      u.approvedHours,
      u.workingCapacityHours,
      u.utilisationPct ? u.utilisationPct.toFixed(2) : '0.00',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const exportsService = new ExportsService();
