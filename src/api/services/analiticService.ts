import apiClient from '../client';
import type { AnalyticParams, AnalyticResponse } from '../types/analityc';

class AnaliticService {
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
}

export default new AnaliticService();