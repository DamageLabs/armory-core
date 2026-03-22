import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Receipt {
  id: number;
  itemId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = '/api/receipts';

  constructor(private http: HttpClient) {}

  getItemReceipts(itemId: number): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.apiUrl}/${itemId}/receipts`);
  }

  uploadReceipt(itemId: number, file: File): Observable<Receipt> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Receipt>(`${this.apiUrl}/${itemId}/receipts`, formData);
  }

  getReceiptDownloadUrl(receiptId: number): string {
    return `${this.apiUrl}/download/${receiptId}`;
  }

  deleteReceipt(receiptId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${receiptId}`);
  }
}