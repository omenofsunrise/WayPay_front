import type { PaginationParams } from "./common";

export interface Client {
    id: number,
    fullName: string,
    phone: string,
    doc: string,
    birthdate: Date,
    docIssueDate: Date
}

export interface ClientParams {
  page?: number;
  pageSize?: number;
  FullName?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ClientForm {
  fullName: string;
  phone: string;
  doc: string;
  birthdate: string; // Для UI - строка в формате "dd.mm.yyyy"
  docIssueDate: string; // Для UI - строка в формате "dd.mm.yyyy"
}

export interface Client extends Omit<ClientForm, 'birthdate' | 'docIssueDate'> {
  id: number;
  birthdate: Date; // Для API - объект Date
  docIssueDate: Date; // Для API - объект Date
}