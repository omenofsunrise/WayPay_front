import type { PaginationParams } from "./common";

export interface Investor {
  currentIncome: any;
  id: number;
  nickname: string;
  fullName: string;
  phoneNumber: string;
  investorPie: number;
  pieInPool?: number;
  investmentAmount: number;
  balance: number;
  activeUntil: string;
  isCompany: boolean;
  isBlocked: boolean;
  isRemoved?: boolean;
  poolId?: number;
  isCompanyPool?: boolean;
}

export interface InvestorParams extends PaginationParams {
  name?: string;
  poolId?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
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
  investorPaymentIncome: number;
  selfPaymentIncome: number;
}

export interface InvestorReportV2Response {
  investment: number;
  balance: number | null;
  paymentIncome: number;
  investorPaymentIncome: number;
  selfPaymentIncome: number;
}

export interface InvestorAgreementResponse {
  city: string;
  investorDate: string;
  investorName: string;
  investment: string;
  investorPie: string;
  companyPie: string;
  investorMonths: string;
  directorName: string;
}

export type InvestorCashPositionType = "Single" | "Pool";

export interface InvestorCashPosition {
  id: number;
  investorId: number;
  poolId: number | null;
  position: InvestorCashPositionType | string;
  date: string;
  createdAt: string;
  investorNickname: string;
  poolName: string | null;
}

export interface MoveInvestorCashPositionRequest {
  investorId: number;
  newPositionType: InvestorCashPositionType;
  poolId: number | null;
  date: string;
}

export interface InvestorCashPositionOperationResponse {
  statusCode: number;
  location?: string;
}
