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
    } catch (err) {
      console.error("Ошибка при удалении платежа:", err);
      alert("Нельзя удалить платёж после реинвестиции");
    }
  }
}

export default new PaymentService();
