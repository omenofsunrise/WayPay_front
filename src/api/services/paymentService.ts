import apiClient from '../client';
import type { Payment, PaymentParams } from '../types/payment';
import type { PaginatedResponse } from '../types/common';

class PaymentService {
  async getPayments(params?: PaymentParams): Promise<PaginatedResponse<Payment>> {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/Payment', { params });
    return response.data;
  }
}

export default new PaymentService();