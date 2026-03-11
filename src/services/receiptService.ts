import { api } from './api';
import { Receipt } from '../types/Receipt';
import { STORAGE_KEYS, getFromStorage } from './storage';

export async function getReceipts(itemId: number): Promise<Receipt[]> {
  return api.get<Receipt[]>(`/receipts/${itemId}/receipts`);
}

export async function uploadReceipt(itemId: number, file: File): Promise<Receipt> {
  const formData = new FormData();
  formData.append('file', file);
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
  if (!res.ok) throw new Error('Failed to download receipt');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
