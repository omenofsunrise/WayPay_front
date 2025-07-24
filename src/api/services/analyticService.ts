import apiClient from '../client';
import type { AnalyticParams, AnalyticResponse, AnalyticSellsResponse } from '../types/analytic';

class AnalyticService {
  async getAnalyticItems(params?: AnalyticParams): Promise<AnalyticResponse> {
    const response = await apiClient.get<AnalyticResponse>('/Analytic/items', { 
      params: {
        ...params,
        start: params?.start?.toISOString(),
        end: params?.end?.toISOString(),
        predefinedPeriod: params?.predefinedPeriod
      } 
    });
    return response.data;
  }

  async getSellInfo(params?: AnalyticParams): Promise<AnalyticSellsResponse> {
    const response = await apiClient.get<AnalyticSellsResponse>('/Analytic/sell-info', {
      params: {
        ...params,
        start: params?.start?.toISOString(),
        end: params?.end?.toISOString(),
        predefinedPeriod: params?.predefinedPeriod
      }
    });
    return response.data;
  }
}

export default new AnalyticService();