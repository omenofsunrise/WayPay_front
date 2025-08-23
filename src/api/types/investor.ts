import type { PaginationParams } from './common';

export interface Investor {
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  investmentAmount: number;
  balance: number;
  activeUntil: string;
  isCompany: boolean;
  isBlocked: boolean;
  poolId?: number;
  income?: number;
}

export interface InvestorParams extends PaginationParams {
  name?: string;
  poolId?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AutoSelectInvestorRequest {
  totalProductAmount: number;
  months: number;
}

export interface AutoSelectInvestorResponse {
  id: number;
  nickname: string;
  balance: number;
  activeUntil: string;
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
  paymentIncome: number;
}