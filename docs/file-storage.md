# File Storage Abstraction Architecture

## 1. Storage Provider Interface

```typescript
export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, destinationPath: string): Promise<{ storagePath: string; fileSize: number }>;
  downloadFile(storagePath: string): Promise<NodeJS.ReadableStream>;
  deleteFile(storagePath: string): Promise<void>;
  getSignedUrl?(storagePath: string, expiresInSeconds: number): Promise<string>;
}
```

## 2. Implementations

- **`LocalStorageProvider`**: Default provider for local development. Validates MIME type, saves to disk under configurable path, and streams securely through authenticated Express routes.
- **`S3StorageProvider`**: Production provider for AWS S3 / MinIO / Google Cloud Storage.
