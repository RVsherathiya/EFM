# Database Schema & Model Design

EFM is backed by MongoDB with Mongoose schemas designed for strong consistency, efficient hierarchy queries, soft deletion, and immutable audit logs.

## 1. Schema List & Entity Relationships

### `User`
- Fields: `employeeCode`, `email`, `passwordHash`, `firstName`, `lastName`, `designation`, `level` (L1-L7), `departmentId`, `managerId`, `roles` (`EMPLOYEE`, `SENIOR`, `PM`, `HR_ADMIN`, `SUPER_ADMIN`), `status` (`ACTIVE`, `INACTIVE`), `isDeleted`.
- References: `departmentId` -> `Department`, `managerId` -> `User`.

### `UserHierarchy` (Closure Table)
- Fields: `ancestorId`, `descendantId`, `depth`.
- Enables $O(1)$ subtree lookups and immediate scope resolution without recursive aggregation pipelines.

### `ManagerHistory`
- Fields: `userId`, `managerId`, `effectiveFrom`, `effectiveTo`, `changedBy`, `reason`.
- Maintains effective-dated reporting changes.

### `Project`
- Fields: `projectCode`, `name`, `client`, `type` (`CLIENT`, `INTERNAL`), `billingModel` (`TIME_AND_MATERIAL`, `FIXED_PRICE`, `NON_BILLABLE`), `startDate`, `endDate`, `status`, `projectManagerId`, `projectLeadId`, `departmentId`.

### `ProjectMember`
- Fields: `projectId`, `userId`, `projectRole`, `allocationPct`, `defaultBillable`, `startDate`, `endDate`, `isActive`.

### `ProjectDocument`
- Fields: `projectId`, `title`, `category`, `fileName`, `fileSize`, `mimeType`, `storagePath`, `version`, `uploadedBy`, `isDeleted`.

### `Task`
- Fields: `userId`, `projectId`, `taskDate`, `title`, `description`, `category`, `hours` (0.25 increments), `isBillable`, `status` (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`), `approvedBy`, `approvedAt`, `rejectionReason`.

### `PeriodLock`
- Fields: `yearMonth`, `isLocked`, `lockedAt`, `unlockedBy`, `unlockReason`.

### `Cycle`
- Fields: `name`, `code`, `year`, `cycleNumber`, `periodStart`, `periodEnd`, `timeline` (self, senior, pm, calibration deadlines), `status`.

### `Criterion`
- Fields: `cycleId`, `name`, `description`, `weight` (sums to 100), `sortOrder`, `scoreDefinitions` (1 to 5), `isActive`.

### `GradeRule`
- Fields: `cycleId`, `grade` (A+ through C-), `priority`, `minScore`, `maxScore`, `description`, `conditions`, `requiresHrApproval`.

### `Review`
- Fields: `cycleId`, `employeeId`, `seniorId`, `pmId`, `status` (`DRAFT`, `SELF_PENDING`, `SELF_SUBMITTED`, `SENIOR_PENDING`, `SENIOR_SUBMITTED`, `PM_PENDING`, `PM_SUBMITTED`, `GRADE_CALCULATED`, `PUBLISHED`, `ACKNOWLEDGED`, `DISPUTED`), `selfSubmittedAt`, `seniorSubmittedAt`, `pmSubmittedAt`, `pmSendBackCount`, `finalScore`, `calculatedGrade`, `publishedAt`, `acknowledgedAt`, `isDisputed`.

### `ReviewRating`
- Fields: `reviewId`, `criterionId`, `reviewerType` (`SELF`, `SENIOR`, `PM`), `score` (1-5), `comment`.

### `ReviewFeedback`
- Fields: `reviewId`, `reviewerType`, `achievements`, `strengths`, `areasOfImprovement`, `actionItems`, `pmExceptionalContribution`, `seniorJustification`.

### `ReviewMetric`
- Fields: `reviewId`, `totalLoggedHours`, `totalApprovedHours`, `billableHours`, `billablePercentage`, `tasksCompleted`, `missedDeadlines`, `hoursByCategory`, `hoursByProject`.

### `Override`
- Fields: `reviewId`, `originalGrade`, `originalScore`, `overriddenGrade`, `overriddenScore`, `reason`, `overriddenBy`.

### `Notification`
- Fields: `recipientId`, `type`, `title`, `message`, `linkUrl`, `readAt`, `metadata`.

### `AuditLog`
- Fields: `userId`, `entityType`, `entityId`, `action`, `oldValues`, `newValues`, `ipAddress`, `userAgent`.
