# Business Rules Documentation (EFM)

This document formalizes all business rules of the **Employee Feedback Portal (EFM)** with unique traceable identifiers (e.g. `BR-AUTH-xxx`, `BR-ORG-xxx`, `BR-REVIEW-xxx`, `BR-GRADE-xxx`, `BR-TASK-xxx`, `BR-PROJ-xxx`, `BR-SCOPE-xxx`). Code implementations and tests reference these IDs.

---

## 1. Authentication & Security (`BR-AUTH`)
- **BR-AUTH-001**: Passwords must be hashed using bcrypt (cost factor >= 10). Passwords and JWT tokens must never be logged or returned in API responses.
- **BR-AUTH-002**: Authentication uses short-lived JWT Access Tokens (e.g., 15m) and secure Refresh Tokens (e.g., 7d) rotated upon each refresh.
- **BR-AUTH-003**: Refresh tokens are stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- **BR-AUTH-004**: Login attempts are rate-limited per IP/Account to prevent brute-force attacks.
- **BR-AUTH-005**: All sensitive mutations (auth changes, manager changes, review overrides, grade publications, period unlocks) are permanently recorded in an append-only `AuditLog`.

---

## 2. Organization & Hierarchy (`BR-ORG`)
- **BR-ORG-001**: Every employee has a designated reporting manager (`managerId`), designation level (L1–L7), department, and assigned system roles (`EMPLOYEE`, `SENIOR`, `PM`, `HR_ADMIN`, `SUPER_ADMIN`).
- **BR-ORG-002**: Reporting hierarchy must be an acyclic tree (DAG). An employee cannot report to themselves or to their direct/indirect subordinates.
- **BR-ORG-003**: Changes to an employee's manager are effective-dated in `ManagerHistory` (`userId`, `managerId`, `effectiveFrom`, `effectiveTo`).
- **BR-ORG-004**: Historical manager changes do **not** rewrite historical review cycle ownership or previously submitted review records.
- **BR-ORG-005**: A user may hold multiple roles simultaneously (e.g., `SENIOR` + `EMPLOYEE`). Permissions are evaluated dynamically per resource and action.

---

## 3. Visibility & Scopes (`BR-SCOPE`)
- **BR-SCOPE-001**: `EMPLOYEE` scope is strictly limited to their own tasks, reviews, projects, and notifications.
- **BR-SCOPE-002**: `SENIOR` scope includes self records, direct reports, and transitive reporting tree subordinates where configured, plus project data for assigned projects.
- **BR-SCOPE-003**: `PM` (Project Manager) scope includes projects managed/led, project members, tasks submitted against their projects, project documents, and PM review stages for project members.
- **BR-SCOPE-004**: `HR_ADMIN` has organization-wide read/write scope across all departments, employees, cycles, reviews, and tasks.
- **BR-SCOPE-005**: `SUPER_ADMIN` has full system access including system configuration, audit logs, and role management.
- **BR-SCOPE-006**: Server-side visibility is enforced at the repository/service layer. Querying by arbitrary ID in URL must fail with `403 Forbidden` or `404 Not Found` if outside user scope. Frontend UI hiding is for UX only.

---

## 4. Project Management (`BR-PROJ`)
- **BR-PROJ-001**: Projects have auto-generated codes (e.g., `PRJ-YYYY-XXX`), type (`CLIENT` or `INTERNAL`), billing model (`TIME_AND_MATERIAL`, `FIXED_PRICE`, `NON_BILLABLE`), and status (`PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`).
- **BR-PROJ-002**: Tasks can only be logged against projects with status `ACTIVE`.
- **BR-PROJ-003**: Internal project tasks are always strictly Non-Billable.
- **BR-PROJ-004**: Project member removal is handled via soft allocation end-dating (`endDate`). Historical assignments are never deleted.
- **BR-PROJ-005**: Project documents support categories (`SOW / Contract`, `Requirements`, `Design`, `Technical`, `Meeting Notes`, `Other`) and versioning on duplicate titles. Max file size: 25MB. Storage uses an abstract `StorageProvider`.

---

## 5. Task & Timesheet Management (`BR-TASK`)
- **BR-TASK-001**: Tasks contain `date`, `projectId`, `title`, `description`, `category` (Development, Testing, Design, Meeting, Documentation, Support, Training, Other), `hours` (0.25 increments, max 24h/day, >12h warning), `dueDate`, `status` (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`), and `billable` flag.
- **BR-TASK-002**: Task date cannot be in the future, cannot precede the project start date, and cannot precede the employee's project assignment start date.
- **BR-TASK-003**: Workflow: `DRAFT` → `SUBMITTED` → (`APPROVED` | `REJECTED`). Rejected tasks can be edited and resubmitted. Approved tasks become immutable/read-only.
- **BR-TASK-004**: Task approval actions: `APPROVE_BILLABLE`, `APPROVE_NON_BILLABLE`, `REJECT` (requires mandatory reason). Both Senior Manager and Project Manager can act on relevant tasks.
- **BR-TASK-005**: Period lock closes task logging/editing on the 5th of the following month. HR Admin can unlock a month with a mandatory audited reason.

---

## 6. Review Cycles & Stages (`BR-CYCLE`)
- **BR-CYCLE-001**: 6 bi-monthly cycles per year by default (C1: Jan-Feb, C2: Mar-Apr, C3: May-Jun, C4: Jul-Aug, C5: Sep-Oct, C6: Nov-Dec). Cycle stage dates are configurable per cycle.
- **BR-CYCLE-002**: Stages: (1) Self Review (Days 1–5), (2) Senior Review (Days 6–10), (3) PM Review (Days 11–14), (4) Grade/Calibration (Days 15–17), (5) Publish/Acknowledge (Days 18–20).
- **BR-CYCLE-003**: Review Criteria versioning is locked per cycle. Default criteria:
  1. Quality of Work (25%)
  2. Timeliness & Delivery (20%)
  3. Technical / Functional Skill (20%)
  4. Communication & Collaboration (15%)
  5. Ownership & Initiative (10%)
  6. Learning & Growth (10%)
  Total weight must equal 100%.

---

## 7. Review Workflow State Machine (`BR-REVIEW`)
- **BR-REVIEW-001**: States: `DRAFT`, `SELF_PENDING`, `SELF_SUBMITTED`, `SENIOR_PENDING`, `SENIOR_SUBMITTED`, `PM_PENDING`, `PM_SUBMITTED`, `GRADE_CALCULATED`, `PUBLISHED`, `ACKNOWLEDGED`, `DISPUTED`.
- **BR-REVIEW-002**: Scoring is on a 1–5 scale (1: Below, 2: Partially meets, 3: Meets, 4: Exceeds, 5: Outstanding). Any score of `5` or `1`/`2` requires a mandatory justification comment.
- **BR-REVIEW-003**: Senior can see Self scores. PM can see Self and Senior scores along with task metrics. Employees cannot view Senior/PM ratings or grade until `PUBLISHED`.
- **BR-REVIEW-004**: Side transition: PM can send back to Senior (`PM_PENDING` → `SENIOR_PENDING`) at most **1 time** with mandatory feedback.
- **BR-REVIEW-005**: Employees can raise a dispute on a `PUBLISHED` review with reason. HR resolves the dispute and republishes.

---

## 8. Scoring & Grade Engine (`BR-GRADE`)
- **BR-GRADE-001**: Criterion weighted percentage = `(score / 5) * criterion_weight`.
- **BR-GRADE-002**: Reviewer default contribution weights:
  - Self = 10%
  - Senior = 50%
  - PM = 40%
- **BR-GRADE-003**: If Self Review is not submitted, its 10% weight is proportionally redistributed to Senior (`50/90 ≈ 55.56%`) and PM (`40/90 ≈ 44.44%`).
- **BR-GRADE-004**: Final Score = `(Self_Score% * w_self) + (Senior_Score% * w_senior) + (PM_Score% * w_pm)`.
- **BR-GRADE-005**: Grade Rules (evaluated in priority order; first match assigned):
  - **A+**: Score >= 95, No Senior/PM criterion < 4, Zero missed deadlines, PM exceptional contribution = true. (Requires HR calibration approval).
  - **A**: Score 90–94.99, No Senior/PM criterion < 4, Missed deadlines <= 1.
  - **A-**: Score 85–89.99, No Senior/PM criterion < 3.
  - **B+**: Score 80–84.99, No Senior/PM criterion < 3.
  - **B**: Score 75–79.99, Maximum 1 criterion < 3.
  - **B-**: Score 70–74.99, Maximum 2 criteria < 3, Quality of Work >= 3.
  - **C+**: Score 65–69.99, Quality of Work >= 2.
  - **C**: Score 60–64.99, Self submitted OR Senior justification provided.
  - **C-**: Score < 60 or fallback when no higher rule matches. (Requires HR calibration approval).
- **BR-GRADE-006**: Calibration Flags:
  - Self vs Senior gap > 1.5 on any single criterion.
  - Senior vs PM grade difference >= 2 grade steps.
  - Grade assigned is A+ or C-.
- **BR-GRADE-007**: HR manual grade override requires mandatory reason and is audited.

---

## 9. Reports & Metrics (`BR-REPORT`)
- **BR-REPORT-001**: Billable % = `(Approved Billable Hours / Total Approved Hours) * 100`.
- **BR-REPORT-002**: Utilisation % = `(Approved Billable Hours / (Working Days in Period * 8)) * 100`.
- **BR-REPORT-003**: Aggregations support filters (date range, cycle, project, department, employee, senior, PM, category, billable, status).
- **BR-REPORT-004**: Export formats include CSV, XLSX (with formatted summary, frozen headers, totals), and PDF (with clean header, metadata, summaries).
