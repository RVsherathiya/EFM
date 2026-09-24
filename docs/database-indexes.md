# MongoDB Indexing Strategy

To achieve target p95 API response times < 500ms, all high-throughput collections feature intentional indexes.

| Collection | Indexed Fields | Type | Purpose |
|------------|----------------|------|---------|
| `users` | `{ email: 1 }` | Unique | Login lookup & uniqueness enforcement |
| `users` | `{ employeeCode: 1 }` | Unique | Employee ID lookup |
| `users` | `{ managerId: 1 }` | Standard | Direct report lookup |
| `users` | `{ departmentId: 1 }` | Standard | Department filtering |
| `userhierarchies` | `{ ancestorId: 1, descendantId: 1 }` | Unique Compound | Fast subtree & closure table traversal |
| `userhierarchies` | `{ descendantId: 1, depth: 1 }` | Compound | Immediate manager lookup |
| `projects` | `{ projectCode: 1 }` | Unique | Project code lookup |
| `projects` | `{ projectManagerId: 1 }` | Standard | PM project queries |
| `projects` | `{ status: 1 }` | Standard | Active project filtering |
| `projectmembers`| `{ projectId: 1, userId: 1 }` | Unique Compound | Unique assignment validation |
| `projectmembers`| `{ userId: 1, isActive: 1 }` | Compound | Member's assigned project list |
| `tasks` | `{ userId: 1, taskDate: -1 }` | Compound | Timesheet date queries |
| `tasks` | `{ projectId: 1, taskDate: -1 }` | Compound | Project effort aggregation |
| `tasks` | `{ status: 1 }` | Standard | Manager approval queue filtering |
| `periodlocks` | `{ yearMonth: 1 }` | Unique | Monthly timesheet lock checking |
| `cycles` | `{ code: 1 }` | Unique | Cycle code lookup |
| `cycles` | `{ status: 1 }` | Standard | Active cycle detection |
| `criteria` | `{ cycleId: 1, sortOrder: 1 }`| Compound | Ordered criteria retrieval |
| `graderules` | `{ cycleId: 1, priority: 1 }` | Compound | Ordered grade evaluation |
| `reviews` | `{ cycleId: 1, employeeId: 1 }`| Unique Compound | One review per employee per cycle |
| `reviews` | `{ seniorId: 1, status: 1 }` | Compound | Senior review queue |
| `reviews` | `{ pmId: 1, status: 1 }` | Compound | PM review queue |
| `reviewratings`| `{ reviewId: 1, reviewerType: 1 }` | Compound | Grouped ratings retrieval |
| `notifications`| `{ recipientId: 1, readAt: 1, createdAt: -1 }` | Compound | Unread badge counts and recent notifications |
| `auditlogs` | `{ entityType: 1, entityId: 1 }` | Compound | Entity audit history inspection |
| `auditlogs` | `{ userId: 1, createdAt: -1 }` | Compound | User activity tracking |
