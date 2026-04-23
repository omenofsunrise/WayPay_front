import apiClient from "../client";
import type { CreateCreditApplicationUser, CreditApplicationUsersResponse, UpdateCreditApplicationRequest } from "../types/applicationUser";
import type { SendNotificationRequest } from "../types/notification";

class AdminPanelService {
  async sendNotification(notificationRequest: SendNotificationRequest): Promise<SendNotificationRequest> {
    const response = await apiClient.post<SendNotificationRequest>('/AdminPanel/bulk', notificationRequest);
    return response.data;
  }

  async getCreditApplicationCompanies(): Promise<CreditApplicationUsersResponse[]> {
    const response = await apiClient.get<CreditApplicationUsersResponse[]>('/AdminPanel/credit-application-companies');
    return response.data;
  }

  async createCreditApplicationCompany(data: CreateCreditApplicationUser): Promise<void> {
    await apiClient.post('/AdminPanel/credit-application-companies', data);
  }

  async updateCreditApplicationCompany(data: UpdateCreditApplicationRequest): Promise<void> {
    await apiClient.put('/AdminPanel/credit-application-companies', data);
  }

  async deleteCreditApplicationCompany(id: string): Promise<void> {
    await apiClient.delete(`/AdminPanel/credit-application-companies/${id}`);
  }
}

export default new AdminPanelService();