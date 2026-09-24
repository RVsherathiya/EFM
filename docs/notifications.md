# Notifications Architecture & Scheduler Jobs

## 1. Notification Types

- `REVIEW_OPEN`: Cycle opened for self assessments.
- `REVIEW_REMINDER`: Approaching self/senior/PM review deadlines.
- `REVIEW_OVERDUE`: Escalation for overdue appraisals.
- `TASK_REMINDER`: Daily timesheet reminder for active employees.
- `TASK_APPROVAL_PENDING`: Notification to managers for pending approvals.
- `CYCLE_PUBLISHED` / `REVIEW_PUBLISHED`: Published grade notification to employee.
- `DISPUTE_CREATED`: Employee raised an appraisal dispute.
- `PROJECT_ASSIGNMENT`: Assigned to new project.

## 2. Channels

- **In-App**: Real-time notifications stored in MongoDB, displayed with unread count badge in Navbar and interactive `NotificationsPage`.
- **Email**: Abstracted email provider (`ConsoleEmailProvider` in dev, `SmtpEmailProvider` in production).

## 3. Scheduled Background Jobs (`node-cron`)

- **Daily Timesheet Reminder**: Runs at 18:00 Mon-Fri.
- **Monthly Period Lock**: Runs at 00:01 on the 5th of every month.
- **Cycle Stage Transition Monitor**: Evaluates deadline triggers hourly.
