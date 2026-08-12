import { StorageService } from './index';
import fs from 'fs/promises';
import path from 'path';

export class LocalStorageService implements StorageService {
  async uploadImage(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    return `/uploads/${filename}`;
  }
}
