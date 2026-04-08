import apiClient from '../client';

export interface CreateSubscriptionRequest {
  days: number;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  tariffType: string;
  userId: string;
  startAt: string | null;
  endAt: string | null;
  paymentUrl: string;
  status: string;
}

export interface CancelSubscriptionResponse {
  status: string;
  transactionStatus: string;
  expiresAt: string | null;
  endAt: string | null;
  message: string;
}

class SubscriptionService {
  /**
   * Создать подписку
   * @param days - количество дней (30, 90, 180, 365)
   * @returns Promise с данными подписки и ссылкой на оплату
   */
  async subscribe(days: number): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.post<CreateSubscriptionResponse>('/Pay/subscribe', { days });
    return response.data;
  }

  /**
   * Отменить подписку
   * @returns Promise с информацией об отмене
   */
  async cancelSubscription(): Promise<CancelSubscriptionResponse> {
    const response = await apiClient.post<CancelSubscriptionResponse>('/Pay/cancel');
    return response.data;
  }

  /**
   * Получить информацию о текущей подписке (если нужно)
   * @param subscriptionId - ID подписки
   */
  async getSubscriptionInfo(subscriptionId: string): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.get<CreateSubscriptionResponse>(`/Pay/subscription/${subscriptionId}`);
    return response.data;
  }
}

export default new SubscriptionService();