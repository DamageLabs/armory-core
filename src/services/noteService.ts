import { api } from './api';
import { Note } from '../types/Note';

interface PaginatedResponse {
  data: Note[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function getNotes(itemId: number, page = 1, pageSize = 20): Promise<PaginatedResponse> {
  return api.get<PaginatedResponse>(`/notes/${itemId}/notes?page=${page}&pageSize=${pageSize}`);
}

export async function getNoteCount(itemId: number): Promise<number> {
  const result = await api.get<{ count: number }>(`/notes/count/${itemId}`);
  return result.count;
}

export async function createNote(itemId: number, content: string): Promise<Note> {
  return api.post<Note>(`/notes/${itemId}/notes`, { content });
}

export async function deleteNote(noteId: number): Promise<void> {
  await api.delete(`/notes/${noteId}`);
}
