import apiClient from '../client';
import type { Note, CreateNoteRequest, NoteableType, NoteFilters } from '../types/note';
import { NOTEABLE_TYPES } from '../types/note';

class NoteService {
  async getNotes(
    type: NoteableType, 
    id: number, 
    includeFiles: boolean
  ): Promise<Note[]> {
    const params = new URLSearchParams();
    if (includeFiles) {
      params.append('includeFiles', 'true');
    }

    const response = await apiClient.get<Note[]>(
      `/Note/by-type/${type}/${id}?${params.toString()}`
    );
    return response.data;
  }

  async getCreditNotes(creditId: number): Promise<Note[]> {
    return this.getNotes(NOTEABLE_TYPES.CREDIT, creditId, false);
  }

  async getFileByNote(noteId: number): Promise<string> {
    const response = await apiClient.get<string>(
      `/Note/file/${noteId}`
    );
    return response.data;
  }

  async getClientNotes(clientId: number): Promise<Note[]> {
    return this.getNotes(NOTEABLE_TYPES.CLIENT, clientId, true);
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
}

export default new NoteService();