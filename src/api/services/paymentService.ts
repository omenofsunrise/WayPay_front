import apiClient from '../client';
import type { Payment, PaymentParams, CreatePaymentRequest } from '../types/payment';
import type { PaginatedResponse } from '../types/common';

class PaymentService {
  async getPayments(params?: PaymentParams): Promise<PaginatedResponse<Payment>> {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/Payment', { params });
    return response.data;
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await apiClient.post<Payment>('/Payment', paymentData);
    return response.data;
  }
}

export default new PaymentService();