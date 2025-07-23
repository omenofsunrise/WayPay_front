import type { PaginationParams } from './common';

export interface AnalyticResponse {
  investmentAmount: number;
  cash: number;
  latePayment: number;
  totalCredits: number;
  activeCredits: number;
  sales: number;
  purchases: number;
}

export interface AnalyticParams {
  start?: Date;
  end?: Date;
  predefinedPeriod?: PredefinedPeriod;
}

export type PredefinedPeriod = 
  | 'Last7Days'
  | 'ThisMonth'
  | 'Last31Days'
  | 'PreviousMonth'
  | 'ThisYear'
  | 'PreviousYear'
  | 'Custom';