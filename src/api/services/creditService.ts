import apiClient from '../client';
import type { Credit, CreditParams, CreateCreditRequest } from '../types/credit';
import type { PaginatedResponse } from '../types/common';

class CreditService {
  async getCredits(params?: CreditParams): Promise<PaginatedResponse<Credit>> {
    const response = await apiClient.get<PaginatedResponse<Credit>>('/Credit', { params });
    return response.data;
  }

  async createCredit(creditData: CreateCreditRequest): Promise<Credit> {
    const response = await apiClient.post<Credit>('/Credit', creditData);
    return response.data;
  }

  async toggleCredit(id: number) {
    await apiClient.put(`/Credit/${id}/toggle-favourite`);
  }

  async deleteCredit(id: number): Promise<void> {
    await apiClient.delete(`/Credit/${id}`);
  }
}

export default new CreditService();