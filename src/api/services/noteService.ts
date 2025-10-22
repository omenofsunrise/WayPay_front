import apiClient from '../client';
import type { Note, CreateNoteRequest, NoteableType, NoteFilters } from '../types/note';
import { NOTEABLE_TYPES } from '../types/note';

class NoteService {
  async getNotes(
    type: NoteableType, 
    id: number, 
    filters?: NoteFilters
  ): Promise<Note[]> {
    const params = new URLSearchParams();
    params.append('includeFiles', 'true');

    const response = await apiClient.get<Note[]>(
      `/Note/by-type/${type}/${id}?${params.toString()}`
    );
    return response.data;
  }

  async getCreditNotes(creditId: number, filters?: NoteFilters): Promise<Note[]> {
    return this.getNotes(NOTEABLE_TYPES.CREDIT, creditId, filters);
  }

  async getClientNotes(clientId: number, filters?: NoteFilters): Promise<Note[]> {
    return this.getNotes(NOTEABLE_TYPES.CLIENT, clientId, filters);
  }

  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const formData = new FormData();
    
    formData.append('noteableType', noteData.noteableType);
    formData.append('noteableId', noteData.noteableId.toString());
    formData.append('content', noteData.content);
    
    
    if (noteData.remindDate) {  
      formData.append('remindDate', noteData.remindDate);
    }
    
    if (noteData.file) {
      formData.append('file', noteData.file);
    }

    const response = await apiClient.post<Note>('/Note', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`/Note/${id}`);
  }

  async downloadNoteFile(noteId: number): Promise<Blob> {
    const response = await apiClient.get(`/Note/${noteId}/file`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new NoteService();