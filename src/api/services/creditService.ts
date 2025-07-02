import apiClient from '../client';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs } from '../types/credit';

class CreditService {
  async getCredits(params?: CreditParams): Promise<CreditResponse> {
    const response = await apiClient.get<CreditResponse>('/Credit', { params });
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

  async getSpaData(id: number): Promise<CreditDocs> {
    const response = await apiClient.get<CreditDocs>(`/Credit/spa${id}`);
    return response.data;
  }
}

export default new CreditService();