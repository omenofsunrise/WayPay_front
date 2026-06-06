import apiClient from "../client";

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

/** Опция прайс-листа: длительность подписки и её стоимость (динамическое ценообразование) */
export interface PayOption {
  days: number;
  cost: number;
}

interface UniversalSubscribeRequest {
  tariffType: TariffType;
  days: number;
  ones?: number;
}

type TariffType = "WaypayCrm";

class SubscriptionService {
  /**
   * Создать подписку
   * @param days - количество дней (30, 90, 180, 365)
   * @returns Promise с данными подписки и ссылкой на оплату
   */
  async subscribe(
    days: number,
    tariffType: TariffType = "WaypayCrm",
    ones?: number
  ): Promise<CreateSubscriptionResponse> {
    const request: UniversalSubscribeRequest = {
      tariffType: tariffType,
      days: days,
    };

    // Добавляем ones только если он передан (для некоторых тарифов)
    if (ones !== undefined) {
      request.ones = ones;
    }

    const response = await apiClient.post<CreateSubscriptionResponse>(
      "/Pay/subscribe",
      request
    );
    return response.data;
  }

  /**
   * Получить актуальный прайс-лист подписки (динамическое ценообразование)
   * @returns Promise со списком доступных вариантов длительности и их стоимости
   */
  async getOptions(): Promise<PayOption[]> {
    const response = await apiClient.get<PayOption[]>("/Pay/options");
    return response.data;
  }

  /**
   * Отменить подписку
   * @returns Promise с информацией об отмене
   */
  async cancelSubscription(): Promise<CancelSubscriptionResponse> {
    const response = await apiClient.post<CancelSubscriptionResponse>(
      "/Pay/cancel"
    );
    return response.data;
  }

  /**
   * Получить информацию о текущей подписке (если нужно)
   * @param subscriptionId - ID подписки
   */
  async getSubscriptionInfo(
    subscriptionId: string
  ): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.get<CreateSubscriptionResponse>(
      `/Pay/subscription/${subscriptionId}`
    );
    return response.data;
  }
}

export default new SubscriptionService();
