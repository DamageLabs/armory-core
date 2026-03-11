import { api } from './api';
import { Receipt } from '../types/Receipt';

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

export function getDownloadUrl(receiptId: number): string {
  return `/api/receipts/download/${receiptId}`;
}
