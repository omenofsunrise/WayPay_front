import type { PaginationParams } from "./common";

export interface Client {
    id: number,
    fullName: string,
    phone: string,
    doc: string,
    birthdate: Date,
}

export interface ClientParams {
  page?: number;
  pageSize?: number;
  FullName?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}