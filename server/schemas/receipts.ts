import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadReceiptMeta = z.object({
  originalName: z.string().min(1, 'Filename is required'),
  mimeType: z.enum(ALLOWED_MIME_TYPES, { error: 'File must be PNG, JPEG, or PDF' }),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE, 'File must be under 10MB'),
});

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
