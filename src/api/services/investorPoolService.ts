import apiClient from '../client';
import type { 
  InvestorPool, 
  InvestorPoolRequest, 
  InvestorPoolParams,
  UpdateNameRequest,
  UpdatePieRequest,
  Reinvestment
} from '../types/investorPool';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { InvestorReport } from '../types/investor';

class InvestorPoolService {
  async getInvestorPools(params?: InvestorPoolParams): Promise<PaginatedResponse<InvestorPool>> {
    const response = await apiClient.get<PaginatedResponse<InvestorPool>>('/InvestorPool', { params });
    return response.data;
  }

  async getInvestorPoolReport(id: number): Promise<InvestorReport> {
    const response = await apiClient.get(`/InvestorPool/report/${id}`);
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
    const response = await apiClient.put<InvestorPool>(`/InvestorPool/${id}/pie`, newPie);
    return response.data;
  }

  async reinvestInvestorPool(id: number) {
    await apiClient.patch(`/InvestorPool/reinvest/${id}`);
    return;
  }

  async getReinvestments(id: number, params: PaginationParams, investorId?: number): Promise<PaginatedResponse<Reinvestment>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    });

    if (investorId !== undefined && investorId !== null && investorId !== 0) {
      queryParams.append('investorId', investorId.toString());
    }

    const url = `/InvestorPool/${id}/reinvestments?${queryParams.toString()}`;
    const respose = await apiClient.get<PaginatedResponse<Reinvestment>>(url);
    return respose.data;
  }

  async deleteInvestorPool(id: number): Promise<void> {
    await apiClient.delete(`/InvestorPool/${id}`);
  }
}

export default new InvestorPoolService();