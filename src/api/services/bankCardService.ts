import apiClient from '../client';
import type { BankCard, BankCardFilters, BankCardRequest } from '../types/bankCard';
import type { PagedResult } from '../types/objectType';

class BankCardService {
  async create(bankCardData: BankCardRequest): Promise<BankCard> {
    const response = await apiClient.post<BankCard>('/BankCard', bankCardData);
    return response.data;
  }

  async getAll(filters?: BankCardFilters): Promise<PagedResult<BankCard>> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/BankCard?${queryString}` : '/BankCard';

    const response = await apiClient.get<PagedResult<BankCard>>(url);
    return response.data;
  }

  async update(id: number, updateData: BankCardRequest): Promise<BankCard> {
    const response = await apiClient.put<BankCard>(`/BankCard/${id}`, updateData);
    return response.data;
  }

  async addWithdraw(id: number, amount: number): Promise<void> {
    const response = await apiClient.patch(`/BankCard/withdraw/${id}`, null, {
      params: { amount }
    });
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/BankCard/${id}`);
  }
}

export default new BankCardService();