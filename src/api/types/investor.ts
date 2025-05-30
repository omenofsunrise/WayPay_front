import type { PaginationParams } from './common';

export interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
  isCompany: boolean;
}

export interface InvestorParams extends PaginationParams {
  name?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AutoSelectInvestorRequest {
  totalProductAmount: number;
}

export interface AutoSelectInvestorResponse {
  id: number;
  nickname: string;
  balance: number;
}