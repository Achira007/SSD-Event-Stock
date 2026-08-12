import { LocalStorageService } from './localStorage';
import { StorageService } from './index';

export const storageService: StorageService = new LocalStorageService();
