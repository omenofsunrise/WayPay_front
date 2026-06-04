import apiClient from "../client";
import type { Credit } from "../types/credit";
import type { PaginatedResponse } from "../types/common";
import type {
  PaymentPending,
  CreatePaymentPendingRequest,
} from "../types/paymentPending";

class PartnerPlaceService {
  // Поиск договоров для приёмки. Единственный параметр — search:
  // в него можно вписать имя клиента, поручителя или номер договора.
  async searchContracts(
    search: string,
    signal?: AbortSignal
  ): Promise<Credit[]> {
    const response = await apiClient.get<Credit[] | PaginatedResponse<Credit>>(
      "/Credit/partner-place",
      { params: { search }, signal }
    );
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
  }

  async createPaymentPending(
    data: CreatePaymentPendingRequest
  ): Promise<PaymentPending> {
    const response = await apiClient.post<PaymentPending>(
      "/PaymentPending/payment-place",
      data
    );
    return response.data;
  }

  async deletePaymentPending(id: number): Promise<void> {
    await apiClient.delete(`/PaymentPending/${id}`);
  }
}

export default new PartnerPlaceService();
