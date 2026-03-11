export type AttachmentCategory = 'receipt' | 'manual' | 'warranty' | 'compliance' | 'inspection' | 'other';

export const ATTACHMENT_CATEGORIES: { value: AttachmentCategory; label: string }[] = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'manual', label: 'Manual' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'other', label: 'Other' },
];

export interface Receipt {
  id: number;
  itemId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
  createdAt: string;
}
