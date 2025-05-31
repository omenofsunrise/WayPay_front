import { useState, useCallback } from 'react';
import noteService from '../services/noteService';
import type { Note, CreateNoteRequest } from '../types/note';

const useNotes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const getNotes = useCallback(async (creditId: number): Promise<Note[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await noteService.getNotes(creditId);
      setNotes(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      }
      catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      finally {
        setIsLoading(false);
      }
    }

  return {
    isLoading,
    error,
    notes,
    getNotes,
    createNote,
    deleteNote
  };
};

export default useNotes;