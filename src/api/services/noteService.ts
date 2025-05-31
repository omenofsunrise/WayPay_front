import apiClient from '../client';
import type { Note, CreateNoteRequest } from '../types/note';

class NoteService {
  async getNotes(creditId: number): Promise<Note[]> {
    const response = await apiClient.get<Note[]>(`/Note/${creditId}`);
    return response.data;
  }

  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const response = await apiClient.post<Note>('/Note', noteData);
    return response.data;
  }

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`/Note/${id}`);
  }
}

export default new NoteService();