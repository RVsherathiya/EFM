# Testing Strategy & Verification

## 1. Test Architecture

The EFM test suite uses **Vitest**, **Supertest**, and **mongodb-memory-server** for fast, hermetic, in-memory integration testing without requiring a live external MongoDB instance.

## 2. Test Coverage Matrix

| Test Suite | Purpose | Tests |
|------------|---------|:---:|
| `health.test.ts` | Base server health check | 2 |
| `auth-scope.test.ts` | Authentication, JWT, and Server-side Scope IDOR prevention (`BR-SCOPE-006`, `BR-SCOPE-002`) | 3 |
| `hierarchy.test.ts` | Hierarchy cycles & self-reporting prevention (`BR-ORG-001`, `BR-ORG-002`) | 3 |
| `projects.test.ts` | Project code auto-generation & document versioning (`BR-PROJ-001`, `BR-PROJ-005`) | 2 |
| `tasks.test.ts` | Task 0.25h increments, future dates, PM approval immutability (`BR-TASK-001`, `BR-TASK-002`, `BR-TASK-003`) | 3 |
| `grade-engine.test.ts` | Pure domain Grade Engine boundary tests (95, 94.99, 90, 89.99, 85, 80, 75, 70, 65, 60, <60), missing self-review redistribution, and calibration flags | 13 |
| `review-workflow.test.ts` | End-to-end review lifecycle: Cycle open -> Self review -> Senior review -> Send-back limit (1x) -> PM review -> Grade calculation -> HR Override -> Publish -> Acknowledge | 1 |
| **Total** | | **27 tests** |

## 3. Running Tests

```bash
# Server tests
cd server
npm test

# Client typecheck and build
cd client
npm run build
```
