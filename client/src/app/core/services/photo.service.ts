import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Photo {
  id: number;
  itemId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private apiUrl = '/api/photos';

  constructor(private http: HttpClient) {}

  getItemPhotos(itemId: number): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/${itemId}/photos`);
  }

  uploadPhoto(itemId: number, file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Photo>(`${this.apiUrl}/${itemId}/photos`, formData);
  }

  getPhotoDownloadUrl(photoId: number): string {
    return `${this.apiUrl}/download/${photoId}`;
  }

  setPrimaryPhoto(photoId: number): Observable<Photo> {
    return this.http.put<Photo>(`${this.apiUrl}/${photoId}/primary`, {});
  }

  deletePhoto(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }
}