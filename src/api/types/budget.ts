import type { PaginatedResponse, PaginationParams } from "./common";

export interface BudgetIncome {
  id: number;
  amount: number;
  comment: string;
  investorId: number;
  createdAt: string;
}

export interface BudgetOutcome {
  id: number;
  amount: number;
  comment: string;
  createdAt: string;
}

export interface CreateBudgetIncomeDto {
  amount: number;
  comment: string;
  investorId?: number;
  investorPoolId?: number;
  companyShare?: number;
}

export interface CreateBudgetOutcomeDto {
  amount: number;
  comment: string;
}

export interface BudgetParams extends PaginationParams {
  month: number;
  year: number;
}

export interface BudgetIncomeResponse extends PaginatedResponse<BudgetIncome> {
  totalIncomeAmount: number;
}

export interface BudgetOutcomeResponse extends PaginatedResponse<BudgetOutcome> {
  totalOutcomeAmount: number;
}