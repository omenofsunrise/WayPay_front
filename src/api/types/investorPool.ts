import type { PaginationParams } from './common';

export interface InvestorPool {
  id: number;
  name: string;
  createdAt: Date;
  balance: number;
  selfIncome?: number;
  activeUntil?: Date;
  isCompanyPool?: boolean;
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

export interface Reinvestment {
  id: number;
  investorId: number;
  date: Date;
  amount: number;
  investorNickname: string;
}
