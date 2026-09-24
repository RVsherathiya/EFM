# Open Business & Architecture Decisions

This document captures architectural and business decisions where domain requirements allow flexibility or require configuration.

---

## 1. Multiple PMs for an Employee in a Single Review Cycle
- **Decision**: In cases where an employee is allocated to multiple active projects with different PMs during a review cycle, the primary project PM (by highest allocation percentage) acts as the primary PM reviewer. The review model also supports consolidated multi-project feedback.
- **Config Key**: `REVIEW_MULTI_PM_STRATEGY = 'PRIMARY_ALLOCATION' | 'CONSOLIDATED'` (Default: `PRIMARY_ALLOCATION`).

## 2. Allocation Warning vs Blocking
- **Decision**: When employee project allocation exceeds 100%, the system renders a warning banner in the UI and records a notification/log, but does not hard-block assignment unless configured in system settings.
- **Config Key**: `BLOCK_ALLOCATION_OVER_100 = false`.

## 3. Storage Provider Fallback
- **Decision**: Development default is `LocalStorageProvider` writing to `server/uploads` with MIME and path traversal verification. Production uses `S3StorageProvider` with signed URLs without changing business layer logic.
- **Config Key**: `STORAGE_PROVIDER = 'local' | 's3'`.

## 4. Large Export Processing Threshold
- **Decision**: Datasets <= 1,000 records export synchronously via streaming HTTP response. Datasets > 1,000 records create an `ExportJob` background task with notification upon completion.
- **Config Key**: `EXPORT_ASYNC_THRESHOLD = 1000`.
