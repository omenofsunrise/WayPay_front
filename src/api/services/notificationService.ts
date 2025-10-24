import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { NotificationResponse } from '../types/notification';

class NotificationService {
  async getMyNotifications(params?: PaginationParams): Promise<PaginatedResponse<NotificationResponse>> {
    const response = await apiClient.get<PaginatedResponse<NotificationResponse>>('/Notification/my', { params });
    return response.data;
  }

  async readNotification(id: number) {
    await apiClient.patch(`/Notification/read/${id}`);
  }
}

export default new NotificationService();