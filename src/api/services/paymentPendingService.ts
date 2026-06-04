import apiClient from "../client";
import type {
  PaymentPending,
  PaymentPendingParams,
} from "../types/paymentPending";

class PaymentPendingService {
  async getPaymentPendings(
    params?: PaymentPendingParams,
    signal?: AbortSignal
  ): Promise<PaymentPending[]> {
    const response = await apiClient.get<PaymentPending[]>("/PaymentPending", {
      params,
      signal,
    });
    return response.data;
  }

  async confirm(id: number): Promise<void> {
    await apiClient.post(`/PaymentPending/${id}/confirm`);
  }

  async reject(id: number): Promise<void> {
    await apiClient.post(`/PaymentPending/${id}/reject`);
  }
}

export default new PaymentPendingService();
