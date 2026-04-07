import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { CreditApplicationResponse, GetCreditApplicationsQuery, RejectApplicationRequest, SelfCreditApplicationResponse } from '../types/creditApplication';

class CreditApplicationService {
  async getCreditApplications(params?: GetCreditApplicationsQuery): Promise<CreditApplicationResponse[]> {
    const response = await apiClient.get<CreditApplicationResponse[]>('/CreditApplication', { params });
    return response.data;
  }

  async getMyCompanyCreditApplications(params?: PaginationParams): Promise<PaginatedResponse<SelfCreditApplicationResponse>> {
    const response = await apiClient.get<PaginatedResponse<SelfCreditApplicationResponse>>('/CreditApplication/my', { params });
    return response.data;
  }

  async acceptCreditApplications(id: number) {
    await apiClient.patch(`CreditApplication/accept/${id}`);
  }

  async rejectCreditApplication(id, body: RejectApplicationRequest) {
    await apiClient.patch(`CreditApplication/reject/${id}`, body);
  }

  async cancelCreditApplications(id: number) {
    await apiClient.patch(`CreditApplication/cancel/${id}`);
  }
}

export default new CreditApplicationService();