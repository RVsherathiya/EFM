# Task & Timesheet Management Module

## 1. Domain Validation Rules

- **BR-TASK-001**: Task hours must be strictly in 0.25h increments (e.g. 0.5, 1.25, 2.75).
- **BR-TASK-002**: Task date cannot be in the future.
- **BR-TASK-003**: Approved tasks are immutable and cannot be edited by the employee.
- **BR-TASK-004**: Rejected tasks can be edited and resubmitted by the employee.
- **BR-TASK-005**: Maximum daily hours per employee is 24 hours. A warning is triggered if daily logged hours exceed 12 hours.
- **BR-TASK-006**: Tasks logged against `INTERNAL` projects are automatically non-billable.

## 2. Monthly Period Locking

- **BR-LOCK-001**: Monthly timesheets are automatically locked on the 5th day of the subsequent month (e.g. January logs lock on Feb 5).
- **BR-LOCK-002**: After locking, task creation and modification are blocked.
- **BR-LOCK-003**: HR Admins can unlock a period for a specific reason, generating an immutable audit record.
