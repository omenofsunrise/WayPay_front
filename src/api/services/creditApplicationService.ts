import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { CreditApplicationResponse, GetCreditApplicationsQuery, SelfCreditApplicationResponse } from '../types/creditApplication';

class CreditApplicationService {
  async getCreditApplications(params?: GetCreditApplicationsQuery): Promise<PaginatedResponse<CreditApplicationResponse>> {
    const response = await apiClient.get<PaginatedResponse<CreditApplicationResponse>>('/CreditApplication', { params });
    return response.data;
  }

  async getMyCompanyCreditApplications(params?: PaginationParams): Promise<PaginatedResponse<SelfCreditApplicationResponse>> {
    const response = await apiClient.get<PaginatedResponse<SelfCreditApplicationResponse>>('/CreditApplication/my', { params });
    return response.data;
  }

  async acceptCreditApplications(id: number) {
    await apiClient.patch(`CreditApplication/accept/${id}`);
  }
}

export default new CreditApplicationService();