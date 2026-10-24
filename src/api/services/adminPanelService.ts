import apiClient from "../client";
import type {
  CreateCreditApplicationUser,
  CreditApplicationUsersResponse,
  UpdateCreditApplicationRequest,
} from "../types/applicationUser";
import type { SendNotificationRequest } from "../types/notification";

class AdminPanelService {
  async sendNotification(
    notificationRequest: SendNotificationRequest
  ): Promise<SendNotificationRequest> {
    const response = await apiClient.post<SendNotificationRequest>(
      "/AdminPanel/bulk",
      notificationRequest
    );
    return response.data;
  }

  async getCreditApplicationCompanies(): Promise<
    CreditApplicationUsersResponse[]
  > {
    const response = await apiClient.get<CreditApplicationUsersResponse[]>(
      "/AdminPanel/credit-application-companies"
    );
    return response.data;
  }

  async createCreditApplicationCompany(
    data: CreateCreditApplicationUser
  ): Promise<void> {
    await apiClient.post("/AdminPanel/credit-application-companies", data);
  }

  async updateCreditApplicationCompany(
    data: UpdateCreditApplicationRequest
  ): Promise<void> {
    await apiClient.put("/AdminPanel/credit-application-companies", data);
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

  async createBroadcastCampaign(
    data: CreateBroadcastCampaignRequest
  ): Promise<void> {
    await apiClient.post("/AdminPanel/broadcast/campaigns", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async getBroadcastCampaigns(
    page: number = 1,
    pageSize: number = 10
  ): Promise<BroadcastCampaignsPagedResponse> {
    const response = await apiClient.get<BroadcastCampaignsPagedResponse>(
      "/AdminPanel/broadcast/campaigns",
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  }

  async cancelBroadcastCampaign(id: number): Promise<void> {
    await apiClient.delete(`/AdminPanel/cancell/broadcast/campaigns/${id}`);
  }

  async updateBroadcastCampaignMessage(
    campaignId: number,
    content: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append("CampaignId", campaignId.toString());
    formData.append("Content", content);

    await apiClient.put("/AdminPanel/broadcast/campaigns/message", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async getBroadcastCampaignChats(
    params: { nextCursor?: string; unread?: boolean; limit?: number } = {}
  ): Promise<BroadcastCampaignChatsResponse> {
    const response = await apiClient.get<BroadcastCampaignChatsResponse>(
      "/AdminPanel/broadcast/campaigns/chats",
      {
        params: {
          NextCursor: params.nextCursor || undefined,
          Unread: params.unread || undefined,
          Limit: params.limit || undefined,
        },
      }
    );
    return response.data;
  }

  async markBroadcastCampaignChatRead(chatId: number): Promise<void> {
    await apiClient.patch(
      `/AdminPanel/broadcast/campaigns/chat/${chatId}/mark/read`
    );
  }

  async getBlacklistPlusUsers(params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<BlacklistPlusUsersResponse> {
    const response = await apiClient.get<BlacklistPlusUsersResponse>(
      "/AdminPanel/blacklist-plus/users",
      { params }
    );
    return response.data;
  }

  async setBlacklistPlusModeration(
    userId: string,
    isModerated: boolean
  ): Promise<BlacklistPlusAdminUser> {
    const response = await apiClient.patch<BlacklistPlusAdminUser>(
      `/AdminPanel/blacklist-plus/users/${userId}/moderation`,
      { isModerated }
    );
    return response.data;
  }

  async addBlacklistPlusSubscription(
    userId: string,
    data: AddBlacklistPlusSubscriptionRequest
  ): Promise<BlacklistPlusSubscriptionResult> {
    const response = await apiClient.post<BlacklistPlusSubscriptionResult>(
      `/AdminPanel/blacklist-plus/users/${userId}/subscription`,
      data
    );
    return response.data;
  }
}

export interface BlacklistPlusAdminUser {
  id: string;
  phone: string;
  fullName: string;
  nickname: string | null;
  isModerated: boolean;
  isDeleted: boolean;
  lastActiveAt: string | null;
  subscriptionStatus: "active" | "expired" | "pending" | "undefined";
  subscriptionEndAt: string | null;
}

export interface BlacklistPlusUsersResponse {
  items: BlacklistPlusAdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AddBlacklistPlusSubscriptionRequest {
  days: number;
  cost: number;
  paymentType: 1 | 2;
}

export interface BlacklistPlusSubscriptionResult {
  userId: string;
  status: string;
  endAt: string | null;
}

export interface CreateBroadcastCampaignRequest {
  title: string;
  content: string;
  file?: File | null;
  test?: boolean;
  campaignType?: "regular" | "upcoming" | "onDay" | "overdue";
  days?: number;
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
  status: "Pending" | "InProgress" | "Completed" | "Failed" | "Cancelled";
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

export interface UpdateBroadcastCampaignMessageRequest {
  campaignId: number;
  content: string;
}

export interface BroadcastCampaignChat {
  id: number;
  lastMessage: string;
  isRead: boolean;
  time: string;
  phone: string;
  channelId?: string;
}

export interface BroadcastCampaignChatsResponse {
  nextCursor: string | null;
  totalCount: number;
  items: BroadcastCampaignChat[];
  hasMore: boolean;
}

export default new AdminPanelService();
