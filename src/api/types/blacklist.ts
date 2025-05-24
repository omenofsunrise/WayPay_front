import type { PaginationParams } from "./common";

export interface Blacklist {
    id: number,
    fullName: string,
    phone: string,
    birthdate: Date,
    docIssueDate: Date
}

export interface BlacklistParams {
  page?: number;
  pageSize?: number;
  FullName?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}