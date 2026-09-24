# Server-Side Visibility Scope Architecture

Security and data privacy are enforced strictly at the database query and service layer, preventing Insecure Direct Object References (IDOR).

## 1. Scope Context Hierarchy

| Role | Visibility Scope | Data Access Boundaries |
|------|------------------|------------------------|
| **EMPLOYEE** | `SELF` | Own tasks, timesheets, assignments, self review, published grade. |
| **SENIOR** | `DIRECT_REPORTS` + `FULL_TREE` | Own records + All direct/indirect subordinates in reporting tree. |
| **PM** | `PROJECT` | Own records + Assigned project members, tasks, and PM assessments. |
| **HR_ADMIN** | `ORGANISATION` | Organisation-wide access to all employees, cycles, calibrations, overrides, locks. |
| **SUPER_ADMIN**| `GLOBAL` | Full unrestricted access to system configuration, audit logs, and data. |

## 2. Server Enforcement Strategy

1. **Context Resolution**: Every authenticated request passes through `scopeService.resolve(user)`, computing:
   - `isHRAdmin` / `isSuperAdmin`
   - `allSubordinateIds` via the `UserHierarchy` closure table.
2. **Repository Query Constraint**: Database filters enforce `{ _id: { $in: [user._id, ...allSubordinateIds] } }` on non-admin requests.
3. **IDOR Prevention**: Manipulating an ID in the URL for an employee outside the user's hierarchy immediately returns `403 Forbidden` (`BR-SCOPE-006`).
