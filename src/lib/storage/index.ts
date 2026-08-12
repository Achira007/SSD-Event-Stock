export interface StorageService {
  uploadImage(file: File): Promise<string>;
}
