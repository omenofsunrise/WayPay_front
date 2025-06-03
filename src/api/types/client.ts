import type { PaginationParams } from "./common";

export interface Client {
    id: number;
    fullName: string;
    phone: string;
    doc: string;
    birthdate: Date | null;
    docIssueDate: Date | null;
    docIssueYear: number;
}

export interface ClientParams extends PaginationParams {
  FullName?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ClientForm {
  fullName: string;
  phone: string;
  doc: string;
  birthdate: string; // For UI - string in format "dd.mm.yyyy"
  docIssueDate: string; // For UI - string in format "dd.mm.yyyy"
  docIssueYear: number;
}

export interface Client extends Omit<ClientForm, 'birthdate' | 'docIssueDate'> {
  id: number;
  birthdate: Date; // Для API - объект Date
  docIssueDate: Date; // Для API - объект Date
}

export interface ClientExistsResponse {
  exists: boolean;
}