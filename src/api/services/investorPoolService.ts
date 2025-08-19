import apiClient from '../client';
import type { 
  InvestorPool, 
  InvestorPoolRequest, 
  InvestorPoolParams,
  UpdateNameRequest,
  UpdatePieRequest
} from '../types/investorPool';
import type { PaginatedResponse } from '../types/common';

class InvestorPoolService {
  async getInvestorPools(params?: InvestorPoolParams): Promise<PaginatedResponse<InvestorPool>> {
    const response = await apiClient.get<PaginatedResponse<InvestorPool>>('/InvestorPool', { params });
    return response.data;
  }

  async createInvestorPool(request: InvestorPoolRequest, companyId: number): Promise<InvestorPool> {
    const response = await apiClient.post<InvestorPool>('/InvestorPool', request, {
      params: { companyId }
    });
    return response.data;
  }

  async updateInvestorPoolName(id: number, newName: string): Promise<InvestorPool> {
    const response = await apiClient.put<InvestorPool>(`/InvestorPool/${id}/name`, newName);
    return response.data;
  }

  async updateInvestorPoolPie(id: number, newPie: number): Promise<InvestorPool> {
    const response = await apiClient.put<InvestorPool>(`/InvestorPool/${id}/pie`, { newPie });
    return response.data;
  }

  async deleteInvestorPool(id: number): Promise<void> {
    await apiClient.delete(`/InvestorPool/${id}`);
  }
}

export default new InvestorPoolService();