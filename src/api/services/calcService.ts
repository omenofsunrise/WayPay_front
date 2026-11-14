import apiClient from "../client";
import type {
  CalcMetric,
  CalcMetricDefinition,
  CalcMetricQuery,
  CalcSheetSummary,
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
  async metric(query: CalcMetricQuery): Promise<CalcMetric> {
    return (await apiClient.get<CalcMetric>("/calc/metrics", { params: query })).data;
  },
};

export default calcService;
