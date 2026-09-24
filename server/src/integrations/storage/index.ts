import { IStorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local-storage.provider.js';

// Factory to resolve storage provider based on environment config
const createStorageProvider = (): IStorageProvider => {
  return new LocalStorageProvider();
};

export const storageProvider: IStorageProvider = createStorageProvider();
