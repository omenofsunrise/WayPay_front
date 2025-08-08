import apiClient from '../client';
import type { Payment, PaymentParams, CreatePaymentRequest, PaymentByCreditParams } from '../types/payment';
import type { PaginatedResponse } from '../types/common';

class PaymentService {
  async getPayments(params?: PaymentParams): Promise<PaymentResponse> {
    const response = await apiClient.get<PaymentResponse>('/Payment', { params });
    return response.data;
  }

  async getPaymentsByCreditId(params: PaymentByCreditParams): Promise<PaginatedResponse<Payment>> {
    const { creditId, ...restParams } = params;
    const response = await apiClient.get<PaginatedResponse<Payment>>(`/Payment/by-credit/${creditId}`, { 
      params: restParams 
    });
    return response.data;
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await apiClient.post<Payment>('/Payment', paymentData);
    return response.data;
  }

  async confirmPayment(id: number): Promise<void> {
    await apiClient.patch(`/Payment/${id}/confirm`);
  }

  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(`/Payment/${id}`);
  }
}

export default new PaymentService();