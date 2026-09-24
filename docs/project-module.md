# Project & Document Storage Architecture

## 1. Project Domain Model

- **Project Codes**: Auto-generated sequential code format: `PRJ-YYYY-XXX` (e.g. `PRJ-2026-001`).
- **Project Status**: `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`. Tasks can only be logged against `ACTIVE` projects.
- **Team Allocations**: Supports multi-project assignments per employee with allocation percentages. A warning is generated if total allocation exceeds 100%.

## 2. Document Storage Abstraction (`StorageProvider`)

Storage is decoupled via a provider interface:
- **Development**: `LocalStorageProvider` saves uploaded files locally under `/uploads` or the designated directory.
- **Production**: `S3StorageProvider` integrates with AWS S3 / Cloudflare R2 / MinIO using signed pre-authenticated URLs.
- **Security**: 25MB file size limit, strict MIME type whitelist (`PDF`, `DOCX`, `XLSX`, `PPTX`, `PNG`, `JPG`, `TXT`, `ZIP`), and server-side authorization before streaming downloads.
- **Versioning**: Uploading a document with an existing title creates version `v+1` without deleting historical versions.
