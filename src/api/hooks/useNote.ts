import { useState, useCallback } from 'react';
import noteService from '../services/noteService';
import type { Note, CreateNoteRequest, NoteableType, NoteFilters } from '../types/note';
import { NOTEABLE_TYPES } from '../types/note';

const useNotes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const getNotes = useCallback(async (
    type: NoteableType, 
    id: number, 
    filters?: NoteFilters
  ): Promise<Note[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await noteService.getNotes(type, id, filters);
      setNotes(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreditNotes = useCallback((creditId: number, filters?: NoteFilters) => {
    return getNotes(NOTEABLE_TYPES.CREDIT, creditId, filters);
  }, [getNotes]);

  const getFileByNote = useCallback((noteId: number) => {
    return noteService.getFileByNote(noteId);
  }, []);

  const getClientNotes = useCallback((clientId: number, filters?: NoteFilters) => {
    return getNotes(NOTEABLE_TYPES.CLIENT, clientId, filters);
  }, [getNotes]);

  const createNote = useCallback(async (noteData: CreateNoteRequest): Promise<Note | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await noteService.createNote(noteData);
      setNotes(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteNote = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await noteService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    notes,
    getNotes,
    getFileByNote,
    getCreditNotes,
    getClientNotes,
    createNote,
    deleteNote,
    clearError: () => setError(null),
    clearNotes: () => setNotes([]),
  };
};

export default useNotes;