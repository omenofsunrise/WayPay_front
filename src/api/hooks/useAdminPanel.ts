import { useState, useCallback } from "react";
import adminPanelService, {
  type BroadcastCampaign,
  type BroadcastCampaignsPagedResponse,
  type CreateBroadcastCampaignRequest,
  type UpdateBroadcastCampaignMessageRequest,
  type BroadcastCampaignChatsResponse,
} from "../services/adminPanelService";
import type { SendNotificationRequest } from "../types/notification";
import type { CreditApplicationUsersResponse } from "../types/applicationUser";

const useAdminPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditApplicationCompanies, setCreditApplicationCompanies] = useState<
    CreditApplicationUsersResponse[]
  >([]);
  const [broadcastCampaigns, setBroadcastCampaigns] = useState<
    BroadcastCampaign[]
  >([]);
  const [broadcastPagination, setBroadcastPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const sendNotification = async (
    notificationData: SendNotificationRequest
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.sendNotification(notificationData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditApplicationCompanies = async (): Promise<
    CreditApplicationUsersResponse[] | null
  > => {
    setIsLoading(true);
    setError(null);
    try {
      const companies = await adminPanelService.getCreditApplicationCompanies();
      setCreditApplicationCompanies(companies);
      return companies;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCreditApplicationCompany = async (
    name: string,
    phone: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.createCreditApplicationCompany({ name, phone });
      await fetchCreditApplicationCompanies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCreditApplicationCompany = async (
    id: string,
    name?: string,
    phone?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.updateCreditApplicationCompany({
        id,
        name,
        phone,
      });
      await fetchCreditApplicationCompanies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCreditApplicationCompany = async (
    id: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.deleteCreditApplicationCompany(id);
      setCreditApplicationCompanies((prev) =>
        prev.filter((company) => company.id !== id)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createBroadcastCampaign = async (
    data: CreateBroadcastCampaignRequest
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.createBroadcastCampaign(data);
      await fetchBroadcastCampaigns(
        broadcastPagination.page,
        broadcastPagination.pageSize
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBroadcastCampaigns = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<BroadcastCampaignsPagedResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPanelService.getBroadcastCampaigns(
        page,
        pageSize
      );
      setBroadcastCampaigns(response.items);
      setBroadcastPagination({
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
      });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBroadcastCampaign = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.cancelBroadcastCampaign(id);
      await fetchBroadcastCampaigns(
        broadcastPagination.page,
        broadcastPagination.pageSize
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWhatsAppChannel = async (channelId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPanelService.toggleWhatsAppChannel(channelId);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBroadcastCampaignMessage = async (
    campaignId: number,
    content: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.updateBroadcastCampaignMessage(
        campaignId,
        content
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBroadcastCampaignChats = async (
    params: { nextCursor?: string; unread?: boolean; limit?: number } = {}
  ): Promise<BroadcastCampaignChatsResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await adminPanelService.getBroadcastCampaignChats(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const markBroadcastCampaignChatRead = async (
    chatId: number
  ): Promise<boolean> => {
    setError(null);
    try {
      await adminPanelService.markBroadcastCampaignChatRead(chatId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    creditApplicationCompanies,
    broadcastCampaigns,
    broadcastPagination,
    sendNotification,
    fetchCreditApplicationCompanies,
    createCreditApplicationCompany,
    updateCreditApplicationCompany,
    deleteCreditApplicationCompany,
    clearError,
    createBroadcastCampaign,
    fetchBroadcastCampaigns,
    cancelBroadcastCampaign,
    toggleWhatsAppChannel,
    updateBroadcastCampaignMessage,
    fetchBroadcastCampaignChats,
    markBroadcastCampaignChatRead,
  };
};

export default useAdminPanel;
