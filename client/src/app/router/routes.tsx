import { RouteObject, Navigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { AuthenticatedRoute } from '../../features/auth/components/AuthenticatedRoute';
import { RoleRoute } from '../../features/auth/components/RoleRoute';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { EmployeesPage } from '../../features/employees/pages/EmployeesPage';
import { OrgTreePage } from '../../features/employees/pages/OrgTreePage';
import { DepartmentsPage } from '../../features/organisation/pages/DepartmentsPage';
import { ProjectsPage } from '../../features/projects/pages/ProjectsPage';
import { ProjectDetailPage } from '../../features/projects/pages/ProjectDetailPage';
import { TasksPage } from '../../features/tasks/pages/TasksPage';
import { WeeklyTimesheetPage } from '../../features/tasks/pages/WeeklyTimesheetPage';
import { TaskApprovalQueuePage } from '../../features/tasks/pages/TaskApprovalQueuePage';
import { PeriodLocksPage } from '../../features/tasks/pages/PeriodLocksPage';
import { CyclesPage } from '../../features/cycles/pages/CyclesPage';
import { CriteriaPage } from '../../features/criteria/pages/CriteriaPage';
import { GradeRulesPage } from '../../features/grade-rules/pages/GradeRulesPage';
import { MyReviewsPage } from '../../features/reviews/pages/MyReviewsPage';
import { TeamReviewsPage } from '../../features/reviews/pages/TeamReviewsPage';
import { ReviewDetailPage } from '../../features/reviews/pages/ReviewDetailPage';
import { CalibrationPage } from '../../features/reviews/pages/CalibrationPage';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { AuditLogsPage } from '../../features/audit/pages/AuditLogsPage';
import { NotificationsPage } from '../../features/notifications/pages/NotificationsPage';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AuthenticatedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          // Accessible to all authenticated roles
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'tasks',
            element: <TasksPage />,
          },
          {
            path: 'tasks/timesheet',
            element: <WeeklyTimesheetPage />,
          },
          {
            path: 'timesheet',
            element: <WeeklyTimesheetPage />,
          },
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          {
            path: 'projects/:id',
            element: <ProjectDetailPage />,
          },
          {
            path: 'reviews',
            element: <MyReviewsPage />,
          },
          {
            path: 'reviews/:id',
            element: <ReviewDetailPage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },

          // Management routes (Senior managers, PMs, HR, Super Admin)
          {
            element: <RoleRoute allowedRoles={['SENIOR', 'PM', 'HR_ADMIN', 'SUPER_ADMIN']} />,
            children: [
              {
                path: 'tasks/approvals',
                element: <TaskApprovalQueuePage />,
              },
              {
                path: 'approvals',
                element: <TaskApprovalQueuePage />,
              },
              {
                path: 'reviews/team',
                element: <TeamReviewsPage />,
              },
            ],
          },

          // Hierarchy routes (Senior, HR, Super Admin)
          {
            element: <RoleRoute allowedRoles={['SENIOR', 'HR_ADMIN', 'SUPER_ADMIN']} />,
            children: [
              {
                path: 'team',
                element: <OrgTreePage />,
              },
            ],
          },

          // HR & Super Admin Administration routes
          {
            element: <RoleRoute allowedRoles={['HR_ADMIN', 'SUPER_ADMIN']} />,
            children: [
              {
                path: 'employees',
                element: <EmployeesPage />,
              },
              {
                path: 'departments',
                element: <DepartmentsPage />,
              },
              {
                path: 'cycles',
                element: <CyclesPage />,
              },
              {
                path: 'criteria',
                element: <CriteriaPage />,
              },
              {
                path: 'grade-rules',
                element: <GradeRulesPage />,
              },
              {
                path: 'period-locks',
                element: <PeriodLocksPage />,
              },
              {
                path: 'reviews/calibration',
                element: <CalibrationPage />,
              },
              {
                path: 'audit-logs',
                element: <AuditLogsPage />,
              },
            ],
          },

          {
            path: '*',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
];
