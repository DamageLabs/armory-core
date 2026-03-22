export interface Photo {
  id: number;
  itemId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  isPrimary: boolean;
  caption: string;
  sortOrder: number;
  createdAt: string;
}
