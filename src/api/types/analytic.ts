import type { PaginationParams } from './common';

export interface AnalyticResponse {
  investmentAmount: number;
  investmentAmountDiffrence: number;
  cash: number;
  cashDiffrence: number;
  latePayment: number;
  latePaymentDiffrence: number;
  totalCredits: number;
  activeCredits: number;
  activeCreditsDiffrence: number;
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

export interface PointData {
  x: number;
  y: number;
  color: string;
  label: string;
  name: string;
}

export interface AnalyticSellsResponse {
  data: PointData[];
}