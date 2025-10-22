export type NoteableType = 'credit' | 'client';

export const NOTEABLE_TYPES = {
  CREDIT: 'credit' as NoteableType,
  CLIENT: 'client' as NoteableType,
};

export interface Note {
  id: number;
  content: string;
  createdAt: string;
  employeeId: number;
  noteableType: NoteableType;
  noteableId: number;
  fileName?: string;
  fileBase64?: string;
}

export interface CreateNoteRequest {
  noteableType: NoteableType;
  noteableId: number;
  content: string;
  file?: File;
  remindDate?: Date;
}

export interface NoteFilters {
  includeFiles?: boolean;
}