import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { RegistrationApproveRequest, RegistrationFilesResponse, RegistrationRejectRequest, RegistrationResponse } from '../types/registrationRequest';

class RegistrationRequestService {
  async getRegistrationRequests(params?: PaginationParams): Promise<PaginatedResponse<RegistrationResponse>> {
    const response = await apiClient.get<PaginatedResponse<RegistrationResponse>>('/RegistrationRequest', { params });
    return response.data;
  }

  async getFilesForRegistrationRequest(id: number): Promise<RegistrationFilesResponse> {
    const response = await apiClient.get<RegistrationFilesResponse>(`/RegistrationRequest/${id}/files`);
    return response.data;
  }

  async approveRegistrationRequest(request: RegistrationApproveRequest) {
    await apiClient.post(`RegistrationRequest/aprrove`, request);
  }

  async rejectRegistrationRequest(request: RegistrationRejectRequest) {
    await apiClient.post(`RegistrationRequest/reject`, request);
  } 
}

export default new RegistrationRequestService();