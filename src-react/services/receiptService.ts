import { api } from './api';
import { Receipt, AttachmentCategory } from '../types/Receipt';
import { STORAGE_KEYS, getFromStorage } from './storage';

export async function getReceipts(itemId: number, category?: AttachmentCategory): Promise<Receipt[]> {
  const query = category ? `?category=${category}` : '';
  return api.get<Receipt[]>(`/receipts/${itemId}/receipts${query}`);
}

export async function uploadReceipt(itemId: number, file: File, category: AttachmentCategory = 'receipt'): Promise<Receipt> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  return api.upload<Receipt>(`/receipts/${itemId}/receipts`, formData);
}

export async function deleteReceipt(receiptId: number): Promise<void> {
  await api.delete(`/receipts/${receiptId}`);
}

export async function getReceiptBlobUrl(receiptId: number): Promise<string> {
  const token = getFromStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
  const res = await fetch(`/api/receipts/download/${receiptId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download attachment');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
