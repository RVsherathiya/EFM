# Authorization & Role-Based Access Control (RBAC)

## 1. Supported Roles

- `SUPER_ADMIN`: System-wide access, audit logs, configuration.
- `HR_ADMIN`: Employee management, cycle management, criteria, grade rules, calibration, period unlocks.
- `SENIOR`: Subordinate hierarchy management, senior reviews, task approvals.
- `PM`: Project configuration, project document uploads, PM review assessments, task approvals.
- `EMPLOYEE`: Baseline role for self assessment, task logging, timesheet submission, and grade acknowledgement.

Users can hold multi-role assignments (e.g. Senior + Employee).
Resource actions are authorized using policy functions (`canRateReview`, `canApproveTask`, `canPublishCycle`, `canViewEmployee`).
