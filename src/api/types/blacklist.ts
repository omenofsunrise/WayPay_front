import type { PaginationParams } from "./common";

export interface Blacklist {
    id: number,
    fullName: string,
    phone: string,
    birthdate: Date,
    document: string,
    docIssueDate: Date,
    address: string,
    debt: number,
    debtEndingAt: Date
}

export interface BlacklistParams {
  page?: number;
  pageSize?: number;
  FullName?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}