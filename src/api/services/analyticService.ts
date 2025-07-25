import apiClient from '../client';
import type { 
  AnalyticParams, 
  AnalyticResponse, 
  SellInfoResponse,
  GraphResponse,
  DebtDynamicResponse
} from '../types/analytic';

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

  async getSellInfo(params?: AnalyticParams): Promise<SellInfoResponse> {
    const response = await apiClient.get<SellInfoResponse>('/Analytic/sell-info', {
      params: {
        ...params,
        start: params?.start?.toISOString(),
        end: params?.end?.toISOString(),
        predefinedPeriod: params?.predefinedPeriod
      }
    });
    return response.data;
  }

  async getInvestmentDynamic(params?: AnalyticParams): Promise<GraphResponse> {
    const response = await apiClient.get<GraphResponse>('/Analytic/InvestmentAmountDynamic', {
      params: {
        ...params,
        start: params?.start?.toISOString(),
        end: params?.end?.toISOString(),
        predefinedPeriod: params?.predefinedPeriod
      }
    });
    return response.data;
  }

  async getDebtDynamic(params?: AnalyticParams): Promise<DebtDynamicResponse> {
    const response = await apiClient.get<DebtDynamicResponse>('/Analytic/DebtDynamic', {
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