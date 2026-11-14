export type CalcSheetSummary = {
  id: number;
  name: string;
  content: string;
  isShared: boolean;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaveCalcSheetRequest = {
  name: string;
  content: string;
  isShared: boolean;
};

export type CalcMetricDefinition = {
  code: string;
  name: string;
  unit: string;
  requiresInvestor: boolean;
};

export type CalcMetric = CalcMetricDefinition & {
  value: number;
  calculatedAt: string;
};

export type CalcMetricQuery = {
  code: string;
  from?: string;
  to?: string;
  poolId?: number;
  investorId?: number;
};
