# Employee Feedback Portal (EFM) - Implementation Plan & Technical Architecture

## 1. Current State
- Empty workspace repository at `/Users/ravisherathiya/Documents/Sherathiya/EFM`.
- Node.js `v24.19.0`, npm `11.17.0` available.
- Requirements and specifications defined in prompt + `docs/business-rules.md` and `docs/open-decisions.md`.

---

## 2. Target Architecture

### Architectural Overview
A decoupled, enterprise-grade architecture:
- **Client**: Single Page App with React 19 / TypeScript / Vite, MUI (Material UI) Theme System, TanStack Query for server state caching and optimistic updates, React Hook Form + Zod for strict client-side validation, React Router v7 with route guards (Authenticated, Role-based, Permission-based), Recharts for enterprise analytics.
- **Server**: Node.js + Express + TypeScript, layered Domain-Driven Architecture (Routes → Controllers → Services → Repositories / Domain Engines → Mongoose Models), Zod at API boundaries, Scope Resolution & Policy Engine for fine-grained multi-tenant/hierarchical access, central error handling with structured JSON API responses, JWT auth with refresh token rotation and `httpOnly` secure cookies.
- **Database**: MongoDB with Mongoose ODM, explicit compound indexes, Materialized Hierarchy (`UserHierarchy` ancestor/descendant graph), effective-dated manager history, soft deletions, and Mongoose session transactions for atomic multi-collection mutations.
- **Integrations**: Abstracted `StorageProvider` (Local disk with safe paths for dev / S3-compatible for prod), Abstracted `NotificationService` & `EmailProvider`, synchronous + background queue `ExportService` (CSV, XLSX, PDF).

---

## 3. Folder Structure

```
efm/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router/
│   │   │   ├── providers/
│   │   │   ├── queryClient/
│   │   │   ├── theme/
│   │   │   └── config/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   ├── feedback/
│   │   │   ├── charts/
│   │   │   ├── dialogs/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── organisation/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── reviews/
│   │   │   ├── cycles/
│   │   │   ├── criteria/
│   │   │   ├── grade-rules/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── permissions/
│   │   │   ├── formatting/
│   │   │   └── storage/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── app/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── routes/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organisation/
│   │   │   ├── departments/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── cycles/
│   │   │   ├── reviews/
│   │   │   ├── criteria/
│   │   │   ├── grade-rules/
│   │   │   ├── reports/
│   │   │   ├── exports/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── policies/
│   │   ├── domain/
│   │   │   ├── grade-engine/
│   │   │   ├── review-workflow/
│   │   │   ├── hierarchy/
│   │   │   ├── task-rules/
│   │   │   └── project-rules/
│   │   ├── jobs/
│   │   ├── integrations/
│   │   ├── utils/
│   │   └── types/
│   ├── tests/
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── docs/
├── scripts/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 4. Dependency List

### Client Dependencies
- `react`, `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `@mui/x-data-grid`, `@mui/x-date-pickers`, `date-fns`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `axios`
- `recharts`
- `notistack` (or custom MUI toast snackbars)

### Server Dependencies
- `express`, `cors`, `helmet`, `cookie-parser`, `compression`, `morgan`
- `mongoose`
- `jsonwebtoken`, `bcryptjs`
- `zod`
- `multer` (for document uploads)
- `node-cron` (for scheduled jobs)
- `csv-parse`, `csv-stringify`, `exceljs`, `pdfkit`
- `nodemailer` (abstract email provider)
- `dotenv`

---

## 5. Phase-by-Phase Plan

### Phase 0: Project Foundation
- Initialize root workspace, `client/` and `server/` with independent build setups.
- Configure TypeScript strict mode, ESLint, Prettier, `.env.example`, `.gitignore`.
- Set up Express app with middleware stack (Helmet, CORS, CookieParser, ErrorHandler, RequestLogger).
- Set up MongoDB connection with auto-retry and index initialization.
- Set up React Vite app with MUI custom theme (primary blue/indigo, dark mode support, modern typography, elevation tokens), TanStack Query client, React Router setup, Axios client with interceptors for token refresh.
- Setup base layout (Sidebar, Navbar, Breadcrumbs, Notification bell, User dropdown, responsive drawer).
- Document foundation and verify build/lint/typecheck.

### Phase 1: Authentication & Organisation Hierarchy
- Users, Roles (`EMPLOYEE`, `SENIOR`, `PM`, `HR_ADMIN`, `SUPER_ADMIN`), Departments, Levels (L1-L7).
- Auth Module: Login, Logout, Refresh Token (httpOnly cookie), Forgot/Reset password, Me endpoint.
- Hierarchy Engine: `UserHierarchy` graph, cycle detection, self-report validation, `ManagerHistory` effective dating.
- Scope Engine & Policies: `ScopeContext`, `ScopeService` resolving `SELF`, `DIRECT_REPORTS`, `FULL_TREE`, `PROJECT`, `DEPARTMENT`, `ORGANISATION`.
- Employee Management UI: List with search/filter, Create/Edit Employee, Manager Assignment, CSV/XLSX Import with preview and validation, Org Chart visualizer.

### Phase 2: Project Management & Documents
- Project Model: code generator (`PRJ-YYYY-XXX`), type, billing model, PM/Lead, client contact, status.
- Member Allocations: role, allocation %, default billable, date ranges, 100% allocation warning.
- Document Storage: Abstraction `StorageProvider` (Local/S3), versioning on duplicate names, MIME/size validation (25MB max), secure authorized streaming download.
- UI: Projects dashboard, Project Detail (Tabs: Overview, Team, Tasks, Documents, Reports, Activity), Project Form dialog.

### Phase 3: Task & Timesheet Management
- Task Model: work date, project, title, description, category, hours (0.25 increments, max 24h, >12h warning), due date, billable flag, status.
- Workflows: Draft, Submit, Approve (Billable/Non-Billable), Reject with reason.
- Period Lock: Auto-lock on 5th of next month, HR unlock with mandatory reason & audit.
- UI: Single Task Entry, Weekly Timesheet Matrix (Mon-Sun with live day/week totals), Approval Queue with bulk actions.

### Phase 4: Review Cycles, Criteria & Grade Rules Configuration
- Cycles Model: 6 bi-monthly default cycles, customizable date ranges for Self, Senior, PM, Calibration, Publish stages.
- Criteria Model: Versioned criteria (Quality 25%, Timeliness 20%, Technical 20%, Communication 15%, Ownership 10%, Learning 10%), 1-5 scale definitions.
- Grade Rules Engine: Rule schema with priority ordering and flexible conditions (`minCriterionScore`, `missedDeadlines`, `exceptionalContribution`, score ranges).
- Grade Simulator: Tool for HR to simulate rules against test scores and preview grade distributions.

### Phase 5: Review Workflow Engine
- Review Model & States: `DRAFT` → `SELF_PENDING` → `SELF_SUBMITTED` → `SENIOR_PENDING` → `SENIOR_SUBMITTED` → `PM_PENDING` → `PM_SUBMITTED` → `GRADE_CALCULATED` → `PUBLISHED` → `ACKNOWLEDGED` / `DISPUTED`.
- Side Transition: PM Send-back to Senior (max 1 time with reason).
- Autosave: Review draft auto-save endpoint.
- UI: Interactive Review Form (Side-by-side comparative views for Senior and PM, Task Metrics snapshot summary, score 1/2 and 5 mandatory comment validator, dispute form, acknowledgment).

### Phase 6: Grade Engine & HR Calibration
- Pure Domain Grade Engine: Weighted criterion calculation, missing self-review redistribution (50/90 Senior, 40/90 PM), condition evaluation, rule matching.
- Calibration Flags: Gap > 1.5, Senior vs PM discrepancy >= 2 grade steps, A+/C- HR approval trigger.
- Calibration UI: HR Calibration Dashboard, Grade Override with mandatory reason, Publish cycle action.

### Phase 7: Reporting, Dashboards & Exports
- Dashboards: Role-tailored dashboards for Employee, Senior, PM, HR Admin, Super Admin.
- Reports: Employee Timesheet, Team Timesheet, Project Effort, Utilisation, Billable Summary, Pending Approvals, Missing Timesheets, Category Breakdown.
- Export Service: CSV, XLSX (summary + detail + formulas + formatting), PDF (headers, filters, summary table, branding).

### Phase 8: Notifications, Scheduled Jobs & Audit Viewer
- Notification System: In-app notifications with badge counter + Email notifications (Console/Nodemailer).
- Jobs (node-cron): Daily task reminders, Review stage reminders, Overdue escalations, Period lock enforcement.
- Audit Viewer: Filterable audit log explorer for HR/Super Admin.

### Phase 9: System Hardening, Testing & Documentation
- Unit tests for Grade Engine (boundary scores 95, 94.99, 90, 89.99, 85, 80, 75, 70, 65, 60, below 60, condition edge cases).
- API integration tests for Review state machine, Tasks, Scope enforcement.
- E2E tests for end-to-end appraisal cycle.
- Final documentation updates (`api.md`, `database.md`, `architecture.md`, `deployment.md`, etc.).

---

## 6. Acceptance Criteria
1. Server and client run independently (`npm run dev` in respective folders).
2. Clean separation of concerns (no Mongo queries in controllers, no business logic in React components).
3. Zero tolerance for fake mock APIs: every UI interaction maps to real backend endpoints and MongoDB collections.
4. Complete test suite for Grade Engine, Review State Machine, Task Rules, and Visibility Scopes.
5. Strict TypeScript compilation without errors (`tsc --noEmit`).
