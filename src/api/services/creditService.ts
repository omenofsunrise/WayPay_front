import apiClient from '../client';
import type { PaginatedResponse } from '../types/common';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs, } from '../types/credit';

class CreditService {
  async getCredits(params?: CreditParams): Promise<CreditResponse> {
    const response = await apiClient.get<CreditResponse>('/Credit', { params });
    return response.data;
  }

  async getCreditsByInvestorId(
    investorId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Credit>> {
    const response = await apiClient.get<PaginatedResponse<Credit>>(
      `/Credit/investor/${investorId}`,
      {
        params: {
          page,
          pageSize
        }
      }
    );
    return response.data;
  }

  async createCredit(creditData: CreateCreditRequest): Promise<Credit> {
    try {
      const response = await apiClient.post<Credit>('/Credit', creditData);
      return response.data;
    }
    catch (err: any) {
      throw err;
    }
  }

  async toggleCredit(id: number) {
    await apiClient.put(`/Credit/${id}/toggle-favourite`);
  }

  async deleteCredit(id: number): Promise<void> {
    await apiClient.delete(`/Credit/${id}`);
  }

  async getSpaData(id: number): Promise<CreditDocs> {
    const response = await apiClient.get<CreditDocs>(`/Credit/spa/${id}`);
    return response.data;
  }
}

export default new CreditService();