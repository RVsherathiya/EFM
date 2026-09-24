# EFM API Reference Specification

Base URL: `/api/v1`

All responses follow the standard JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

## 1. Authentication & Identity
- `POST /auth/login`: Authenticates with email and password, sets secure httpOnly cookies, returns JWT access token and user profile.
- `POST /auth/refresh`: Rotates refresh token and returns new access token.
- `POST /auth/logout`: Clears session cookies and revokes session.
- `GET /auth/me`: Returns current authenticated user and role permissions.

## 2. Organisation & Hierarchy
- `GET /users`: Paginated employee directory scoped by viewer hierarchy.
- `POST /users`: Create new employee with manager and department assignment.
- `GET /users/:id`: Get employee details (Scope protected).
- `PATCH /users/:id`: Update employee details.
- `PATCH /users/:id/manager`: Updates employee reporting manager, prevents hierarchy cycles, and logs history.
- `GET /org/tree`: Retrieves subordinate reporting tree or company org chart.
- `GET /departments`: Lists active departments.
- `POST /departments`: Creates a new department with head assignment.

## 3. Project Management & Documents
- `GET /projects`: Lists projects within viewer scope (search, type, status filters).
- `POST /projects`: Creates project with auto-generated code (`PRJ-YYYY-XXX`).
- `GET /projects/:id`: Get project detail with team and document count.
- `PATCH /projects/:id`: Update project details.
- `GET /projects/:id/members`: List assigned team members and allocation %.
- `POST /projects/:id/members`: Assign team member (validates total allocation warning).
- `DELETE /projects/:id/members/:memberId`: Remove project assignment (soft end-date).
- `GET /projects/:id/documents`: List project documents and versions.
- `POST /projects/:id/documents`: Multipart upload (MIME validation, 25MB max).
- `GET /projects/documents/:docId/download`: Stream document with scope authorization.

## 4. Tasks & Timesheets
- `GET /tasks`: List daily logged tasks with pagination and date filters.
- `POST /tasks`: Create task (validates 0.25h increments, max 24h/day, no future dates, active project).
- `PATCH /tasks/:id`: Update draft or rejected task.
- `DELETE /tasks/:id`: Delete draft task.
- `POST /tasks/submit`: Submit draft tasks for manager approval.
- `GET /tasks/approvals`: Approval queue for Senior / PM.
- `POST /tasks/approve`: Approve task as Billable or Non-Billable.
- `POST /tasks/reject`: Reject task with mandatory reason.
- `GET /period-locks`: List monthly period locking status.
- `POST /period-locks/:yearMonth/unlock`: HR unlock with mandatory reason.

## 5. Appraisal Cycles, Criteria & Grade Engine
- `GET /cycles`: List bi-monthly appraisal cycles (C1 to C6).
- `POST /cycles`: Create cycle with stage deadlines.
- `POST /cycles/:id/open`: Open appraisal cycle for self-assessments.
- `GET /criteria`: List performance assessment criteria.
- `POST /criteria`: Create criterion with score definitions (1 to 5).
- `PATCH /criteria/:id`: Update criterion weight and definitions.
- `GET /grade-rules`: List configured priority grade rules.
- `PUT /grade-rules`: Batch update priority rules.
- `POST /grade-rules/simulate`: Real-time pure domain grade engine simulation.

## 6. Appraisal Reviews & Calibration
- `GET /reviews/my`: List reviews for logged-in employee.
- `GET /reviews/pending`: Pending review queue for Senior and PM reviewers.
- `GET /reviews/calibration`: Calibration list for HR Admin.
- `GET /reviews/:id`: Full review detail with side-by-side ratings and metrics snapshot.
- `PUT /reviews/:id/self`: Submit employee self assessment (validates score comments).
- `PUT /reviews/:id/senior`: Submit Senior manager ratings.
- `PUT /reviews/:id/pm`: Submit Project Manager ratings.
- `POST /reviews/:id/send-back`: PM sends back review to Senior (max 1x).
- `POST /reviews/:id/override`: HR Admin grade override with mandatory reason.
- `POST /reviews/:id/publish`: Publish review to employee.
- `POST /reviews/:id/acknowledge`: Employee acknowledges published review.
- `POST /reviews/:id/dispute`: Employee raises dispute for HR review.

## 7. Reports & Exports
- `GET /reports/timesheet`: Timesheet records report.
- `GET /reports/project-effort`: Project effort aggregation.
- `GET /reports/utilisation`: Employee utilisation % report (`billable / capacity * 100`).
- `GET /reports/category-breakdown`: Hours breakdown by task category.
- `GET /reports/billable-summary`: Overall billable vs non-billable summary.
- `GET /exports/timesheet`: Stream timesheet CSV export.
- `GET /exports/project-effort`: Stream project effort CSV export.
- `GET /exports/utilisation`: Stream utilisation CSV export.

## 8. Notifications & Audits
- `GET /notifications`: List in-app notifications and unread count.
- `PATCH /notifications/:id/read`: Mark notification as read.
- `PATCH /notifications/read-all`: Mark all notifications as read.
- `GET /audit-logs`: Immutable system audit log records (HR / Super Admin only).
