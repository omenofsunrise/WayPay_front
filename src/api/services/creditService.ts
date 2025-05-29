import apiClient from '../client';
import type { Credit, CreditParams } from '../types/credit';
import type { PaginatedResponse } from '../types/common';

class CreditService {
  async getCredits(params?: CreditParams): Promise<PaginatedResponse<Credit>> {
    const response = await apiClient.get<PaginatedResponse<Credit>>('/Credit', { params });
    return response.data;
  }
}

export default new CreditService();