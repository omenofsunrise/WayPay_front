import { useState, useCallback } from 'react';
import taskNoteService from '../services/taskNoteService';
import type { TaskNote, TaskNoteCreateDto, TaskNoteUpdateDto } from '../types/taskNote';

const useTaskNote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [currentNote, setCurrentNote] = useState<TaskNote | null>(null);

  const getNotesByTaskId = useCallback(async (taskId: number): Promise<TaskNote[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskNoteService.getNotesByTaskId(taskId);
      setNotes(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNoteById = useCallback(async (id: number): Promise<TaskNote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskNoteService.getNoteById(id);
      setCurrentNote(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNote = async (noteDto: TaskNoteCreateDto): Promise<TaskNote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdNote = await taskNoteService.createNote(noteDto);
      setNotes(prev => [...prev, createdNote]);
      return createdNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (id: number, noteDto: TaskNoteUpdateDto): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await taskNoteService.updateNote(id, noteDto);
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, text: noteDto.text } : note
      ));
      if (currentNote?.id === id) {
        setCurrentNote(prev => prev ? { ...prev, text: noteDto.text } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await taskNoteService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      if (currentNote?.id === id) {
        setCurrentNote(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    notes,
    currentNote,
    getNotesByTaskId,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
  };
};

export default useTaskNote;