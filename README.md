# Employee Feedback Portal (EFM)

> Production-grade enterprise performance appraisal, continuous feedback, project allocation, and daily timesheet management system.

---

## 🏗️ Architecture Overview

The application is structured into decoupled, independently runnable client and server packages:

- **Frontend (`client/`)**: React 19 + TypeScript + Vite, Material UI (MUI v6) with customized enterprise theme tokens, TanStack Query for server cache management, React Hook Form + Zod for strict client validation, React Router, Recharts for visual analytics.
- **Backend (`server/`)**: Node.js + Express + TypeScript, Layered Domain Architecture (Routes → Controllers → Services → Repositories → Mongoose Models), Zod at API boundaries, Scope & Policy Resolution engine for hierarchical visibility, structured JSON logging, standard API response contract (`sendSuccess` / `sendError`), JWT auth with refresh token rotation and `httpOnly` secure cookies.
- **Database (`MongoDB`)**: Materialized ancestor-descendant hierarchy closure table (`UserHierarchy`), effective-dated manager history (`ManagerHistory`), compound indexes, soft deletes, session transactions.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 10
- MongoDB instance (or Docker)

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Start MongoDB (via Docker)
```bash
docker compose up -d mongodb
```

### 3. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Seed Development Database
```bash
cd server && npm run seed
```

### 5. Run Development Servers
```bash
# In terminal 1:
cd server && npm run dev    # Starts backend on http://localhost:5000

# In terminal 2:
cd client && npm run dev    # Starts frontend on http://localhost:5173
```

---

## 🧪 Testing & Quality Checks

```bash
# Run server test suite (7 suites, 27 tests in-memory)
cd server && npm test

# Run TypeScript compilation checks
cd server && npm run typecheck
cd ../client && npm run build
```

---

## 📚 Complete Technical Documentation

- [Architecture Overview](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/architecture.md)
- [API Reference Specification](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/api.md)
- [Database Schema & Models](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/database.md)
- [Database Indexing Strategy](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/database-indexes.md)
- [Authentication & Sessions](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/authentication.md)
- [Authorization & RBAC](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/authorization.md)
- [Visibility Scope Engine](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/visibility-scope.md)
- [Review Workflow State Machine](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/review-workflow.md)
- [Pure Domain Grade Engine](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/grade-engine.md)
- [Project & Document Storage](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/project-module.md)
- [Task & Timesheet Management](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/task-module.md)
- [Reporting & Analytics](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/reporting.md)
- [Notifications & Scheduler Jobs](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/notifications.md)
- [File Storage Abstraction](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/file-storage.md)
- [Testing Strategy & Matrices](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/testing.md)
- [Production Deployment](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/deployment.md)
- [Business Rules Traceability Matrix](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/business-rules.md)
- [Open Decisions](file:///Users/ravisherathiya/Documents/Sherathiya/EFM/docs/open-decisions.md)
