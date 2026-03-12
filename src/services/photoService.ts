import { api } from './api';
import { Photo } from '../types/Photo';
import { STORAGE_KEYS, getFromStorage } from './storage';

export async function getPhotos(itemId: number): Promise<Photo[]> {
  return api.get<Photo[]>(`/photos/${itemId}/photos`);
}

export async function uploadPhoto(itemId: number, file: File, caption = ''): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);
  return api.upload<Photo>(`/photos/${itemId}/photos`, formData);
}

export async function deletePhoto(photoId: number): Promise<void> {
  await api.delete(`/photos/${photoId}`);
}

export async function setPrimary(photoId: number): Promise<void> {
  await api.put(`/photos/${photoId}/primary`);
}

export async function reorderPhotos(itemId: number, photoIds: number[]): Promise<void> {
  await api.put(`/photos/${itemId}/reorder`, { photoIds });
}

export async function getPhotoBlobUrl(photoId: number): Promise<string> {
  const token = getFromStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
  const res = await fetch(`/api/photos/download/${photoId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download photo');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
