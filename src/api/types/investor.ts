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
  isBlocked: boolean;
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

export interface InvestorReport {
  nickName: string;
  fullName: string;
  createdAt: string;
  investment: number;
  activeCreditsAmount: number;
  investorIncome: number;
  selfIncome: number;
  balance: number;
  isCompany: boolean;
  delinquencyAmount: number;
  allSelfIncome: number;
}