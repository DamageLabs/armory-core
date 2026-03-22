import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Note {
  id: number;
  itemId: number;
  content: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = '/api/notes';

  constructor(private http: HttpClient) {}

  getItemNotes(itemId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/${itemId}/notes`);
  }

  getNoteCount(itemId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count/${itemId}`);
  }

  createNote(itemId: number, content: string): Observable<Note> {
    return this.http.post<Note>(`${this.apiUrl}/${itemId}/notes`, { content });
  }

  deleteNote(noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${noteId}`);
  }
}