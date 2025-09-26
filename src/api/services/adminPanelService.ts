import apiClient from "../client";
import type { SendNotificationRequest } from "../types/notification";

class adminPanelService {
  async SendNotification(notificationRequest: SendNotificationRequest): Promise<SendNotificationRequest> {
    const response = await apiClient.post<SendNotificationRequest>('/AdminPanel/bulk', notificationRequest);
    return response.data;
  }
}

export default new adminPanelService();