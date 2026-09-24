import { Readable } from 'stream';

export interface UploadResult {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  getFileStream(storageKey: string): Promise<{ stream: Readable; fileSize: number; mimeType: string }>;
  deleteFile(storageKey: string): Promise<void>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
}
