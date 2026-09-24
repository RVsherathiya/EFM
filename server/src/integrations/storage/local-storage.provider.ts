import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageProvider, UploadResult } from './storage.interface.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.LOCAL_STORAGE_PATH || './uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sanitizeStorageKey(storageKey: string): string {
    const safeKey = path.basename(storageKey);
    const resolvedPath = path.resolve(this.baseDir, safeKey);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw AppError.badRequest('Invalid file key or path traversal attempt.');
    }
    return resolvedPath;
  }

  public async uploadFile(fileBuffer: Buffer, originalFileName: string, mimeType: string): Promise<UploadResult> {
    const ext = path.extname(originalFileName).toLowerCase();
    const randomHex = crypto.randomBytes(16).toString('hex');
    const storageKey = `${Date.now()}-${randomHex}${ext}`;
    const filePath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(filePath, fileBuffer);

    return {
      storageKey,
      fileName: originalFileName,
      fileSize: fileBuffer.length,
      mimeType,
    };
  }

  public async getFileStream(storageKey: string) {
    const filePath = this.sanitizeStorageKey(storageKey);
    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('Requested file does not exist on disk.');
    }

    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);

    return {
      stream,
      fileSize: stat.size,
      mimeType: 'application/octet-stream',
    };
  }

  public async deleteFile(storageKey: string): Promise<void> {
    const filePath = this.sanitizeStorageKey(storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  public async getSignedUrl(storageKey: string): Promise<string> {
    // For local storage, returns the direct API download endpoint
    return `/api/v1/projects/documents/download/${encodeURIComponent(storageKey)}`;
  }
}
