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

  async toggleWhatsAppChannel(channelId: string) {
    const response = await apiClient.patch(
      `/WhatsApp/broadcast-channels/${channelId}/toggle`
    );
    return response.data;
  }

  async createBroadcastCampaign(data: CreateBroadcastCampaignRequest): Promise<void> {
    await apiClient.post('/AdminPanel/broadcast/campaigns', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getBroadcastCampaigns(page: number = 1, pageSize: number = 10): Promise<BroadcastCampaignsPagedResponse> {
    const response = await apiClient.get<BroadcastCampaignsPagedResponse>('/AdminPanel/broadcast/campaigns', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async cancelBroadcastCampaign(id: number): Promise<void> {
    await apiClient.delete(`/AdminPanel/cancell/broadcast/campaigns/${id}`);
  }
}

export interface CreateBroadcastCampaignRequest {
  title: string;
  content: string;
  file?: File | null;
}

export interface BroadcastCampaignMessage {
  id: number;
  content: string;
  fileId: string | null;
  campaignId: number;
  campaign: string;
}

export interface BroadcastCampaign {
  id: number;
  title: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Cancelled';
  createdAt: string;
  completedAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  message: {
    id: number;
    content: string;
    fileId: string | null;
    campaignId: number;
  };
}

export interface BroadcastCampaignsPagedResponse {
  items: BroadcastCampaign[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default new AdminPanelService();