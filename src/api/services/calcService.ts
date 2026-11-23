import apiClient from "../client";
import type {
  CalcMetric,
  CalcMetricDefinition,
  CalcMetricQuery,
  CalcMetricOptions,
  CalcMetricSeries,
  CalcMetricSeriesQuery,
  CalcSheetSummary,
  CalcInvestorReport,
  SaveCalcSheetRequest,
} from "../types/calc";

const calcService = {
  async list(): Promise<CalcSheetSummary[]> {
    return (await apiClient.get<CalcSheetSummary[]>("/calc/sheets")).data;
  },
  async get(id: number): Promise<CalcSheetSummary> {
    return (await apiClient.get<CalcSheetSummary>(`/calc/sheets/${id}`)).data;
  },
  async create(request: SaveCalcSheetRequest): Promise<CalcSheetSummary> {
    return (await apiClient.post<CalcSheetSummary>("/calc/sheets", request)).data;
  },
  async update(id: number, request: SaveCalcSheetRequest): Promise<CalcSheetSummary> {
    return (await apiClient.put<CalcSheetSummary>(`/calc/sheets/${id}`, request)).data;
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/calc/sheets/${id}`);
  },
  async catalog(): Promise<CalcMetricDefinition[]> {
    return (await apiClient.get<CalcMetricDefinition[]>("/calc/metrics/catalog")).data;
  },
  async options(): Promise<CalcMetricOptions> {
    return (await apiClient.get<CalcMetricOptions>("/calc/metrics/options")).data;
  },
  async metric(query: CalcMetricQuery): Promise<CalcMetric> {
    return (await apiClient.get<CalcMetric>("/calc/metrics", { params: query })).data;
  },
  async metricSeries(query: CalcMetricSeriesQuery): Promise<CalcMetricSeries> {
    return (await apiClient.get<CalcMetricSeries>("/calc/metrics/series", { params: query })).data;
  },
  async investorReports(poolId?: number): Promise<CalcInvestorReport[]> {
    return (await apiClient.get<CalcInvestorReport[]>("/calc/investor-reports", {
      params: poolId ? { poolId } : undefined,
    })).data;
  },
};

export default calcService;
