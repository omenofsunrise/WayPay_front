import type { PaginationParams } from './common';

export interface InvestorPool {
  id: number;
  name: string;
  pie: number;
  createdAt: Date;
}

export interface InvestorPoolRequest {
  name: string;
  pie: number;
}

export interface InvestorPoolParams extends PaginationParams {
  sortBy?: 'name' | 'pie';
  sortDirection?: 'asc' | 'desc';
}

export interface UpdateNameRequest {
  newName: string;
}

export interface UpdatePieRequest {
  newPie: number;
}