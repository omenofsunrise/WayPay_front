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
  | 'Today'
  | 'Yesterday'
  | 'ThisWeek'
  | 'LastWeek'
  | 'ThisMonth'
  | 'LastMonth'
  | 'ThisQuarter'
  | 'LastQuarter'
  | 'ThisYear'
  | 'LastYear'
  | 'Custom';