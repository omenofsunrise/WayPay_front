import type { PaginationParams } from './common';

export interface BankCard {
  id: number;
  phone: string;
  details: string;
}

export interface BankCardRequest {
  phone?: string;
  details?: string;
}

export interface BankCardFilters {
  page?: number;
  pageSize?: number;
}