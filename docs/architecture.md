# EFM Architecture Overview

The **Employee Feedback Portal (EFM)** is an enterprise appraisal and workforce performance platform built with strict domain-driven design, layered architecture, server-side visibility scopes, and pure domain calculation engines.

## 1. System Topology

```
+-------------------------------------------------------------------+
|                        React Frontend Client                      |
| (Vite + TypeScript + React Router + TanStack Query + MUI v6)     |
+-------------------------------------------------------------------+
                                  |
                                  | REST / JSON / Multipart
                                  v
+-------------------------------------------------------------------+
|                        Node.js / Express API                      |
|                                                                   |
| [Middleware: Auth, Scope Resolution, Validation, Error Handling]  |
|                                                                   |
| [Modules: Users, Org, Projects, Tasks, Cycles, Criteria, Reviews] |
|                                                                   |
| [Pure Domain Engines: Grade Engine, Workflow State Machine]       |
|                                                                   |
| [Background Jobs: node-cron Scheduler for Reminders & Locking]    |
+-------------------------------------------------------------------+
                                  |
                                  | Mongoose ODM / Transactions
                                  v
+-------------------------------------------------------------------+
|                      MongoDB Database Engine                      |
| (Closure Table Hierarchy, Compound Indexes, Immutable Audit Logs) |
+-------------------------------------------------------------------+
```

## 2. Layered Backend Architecture

Every backend feature adheres to strict separation of concerns:
- **Routes**: Expose REST endpoints and attach authentication, scope, and Zod validation middlewares.
- **Controllers**: Thin request orchestrators (Input parsing -> Service execution -> Standardized response).
- **Services**: Business orchestration, audit logging, notifications, and transactions.
- **Repositories & Models**: Strongly typed Mongoose models with explicit indexing and soft-delete support.
- **Domain Engines**: Pure, side-effect-free business calculation logic (e.g. `GradeEngine`, `ReviewWorkflowStateMachine`, `HierarchyCycleDetector`).
- **Integrations**: Storage abstractions (`LocalStorageProvider`, `S3StorageProvider`), email abstractions.

## 3. Frontend Architecture

The client application follows a feature-driven structure:
- `client/src/features/<feature>/api/`: API clients using strongly typed Axios instance.
- `client/src/features/<feature>/pages/`: Modern, responsive views adhering to Material Design enterprise standards.
- `client/src/features/<feature>/components/`: Reusable components (e.g. Timesheet Matrix, Criteria Cards, Grade Simulator).
- `client/src/components/layout/`: Responsive Sidebar, Navbar with live unread notifications badge, Breadcrumbs.
