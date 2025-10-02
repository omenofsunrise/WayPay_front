import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { CreditApplicationResponse } from '../types/creditApplication';

class CreditApplicationService {
  async getCreditApplications(params?: PaginationParams): Promise<PaginatedResponse<CreditApplicationResponse>> {
    const response = await apiClient.get<PaginatedResponse<CreditApplicationResponse>>('/CreditApplication', { params });
    return response.data;
  }

  async acceptCreditApplications(id: number) {
    await apiClient.patch(`CreditApplication/accept/${id}`);
  }
}

export default new CreditApplicationService();