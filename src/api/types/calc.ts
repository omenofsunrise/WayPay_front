export type CalcAccessLevel = "owner" | "edit" | "formulas" | "view";

export type CalcSheetSummary = {
  id: number;
  name: string;
  content: string;
  isShared: boolean;
  canEdit: boolean;
  accessLevel: CalcAccessLevel;
  canManageAccess: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CalcSheetAccessRule = {
  employeeId: number;
  employeeName?: string;
  level: Exclude<CalcAccessLevel, "owner">;
  sheetIds: string[];
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

export type CalcMetricSeriesPoint = {
  label: string;
  from: string;
  to: string;
  value: number;
};

export type CalcMetricSeries = {
  code: string;
  name: string;
  unit: string;
  groupBy: "day" | "month";
  points: CalcMetricSeriesPoint[];
  calculatedAt: string;
};

export type CalcMetricSeriesQuery = CalcMetricQuery & {
  from: string;
  to: string;
  groupBy: "day" | "month";
};

export type CalcMetricOption = { id: number; name: string };
export type CalcMetricOptions = {
  pools: CalcMetricOption[];
  investors: CalcMetricOption[];
};
