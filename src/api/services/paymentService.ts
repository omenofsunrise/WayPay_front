import apiClient from "../client";
import type {
  Payment,
  PaymentParams,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentByCreditParams,
  PaymentTab,
  PaymentResponse,
} from "../types/payment";
import type { PaginatedResponse } from "../types/common";

class PaymentService {
  async getPayments(params?: PaymentParams): Promise<PaymentResponse> {
    const response = await apiClient.get<PaymentResponse>("/Payment", {
      params,
    });
    return response.data;
  }

  async getPaymentTab(paymentId: number): Promise<PaymentTab> {
    const response = await apiClient.get<PaymentTab>(
      `/Payment/payment-tab/${paymentId}`
    );
    return response.data;
  }

  async getPaymentsByCreditId(
    params: PaymentByCreditParams
  ): Promise<PaymentResponse> {
    const { creditId, ...restParams } = params;
    const response = await apiClient.get<PaymentResponse>(
      `/Payment/by-credit/${creditId}`,
      {
        params: restParams,
      }
    );
    return response.data;
  }

  async createPayment(
    paymentData: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<CreatePaymentResponse>(
      "/Payment",
      paymentData
    );
    return response.data;
  }

  async confirmPayment(id: number): Promise<void> {
    await apiClient.patch(`/Payment/${id}/confirm`);
  }

  async confirmPaymentList(params?: PaymentParams) {
    await apiClient.patch("/Payment/confirm/list", null, {
      params: params,
    });
    return;
  }

  async deletePayment(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Payment/${id}`);
    } catch (err: any) {
      // Пробрасываем реальную причину отказа, а не «молча успех».
      // Иначе интерфейс считает платёж удалённым, хотя он остался в базе,
      // что приводит к задвоению платежей и занижению остатка.
      const backendMessage =
        err?.response?.data?.message ??
        (typeof err?.response?.data === "string" ? err.response.data : null);
      throw new Error(
        backendMessage || "Не удалось удалить платёж. Попробуйте ещё раз."
      );
    }
  }
}

export default new PaymentService();
