import apiClient from "../client";
import type {
  PaymentPlace,
  CreatePaymentPlaceRequest,
  UpdatePaymentPlaceRequest,
} from "../types/paymentPlace";

const BASE_PATH = "/PaymentPlace/payment-place";

class PaymentPlaceService {
  async getPaymentPlaces(): Promise<PaymentPlace[]> {
    const response = await apiClient.get<PaymentPlace[]>(BASE_PATH);
    return response.data;
  }

  async createPaymentPlace(
    data: CreatePaymentPlaceRequest
  ): Promise<PaymentPlace> {
    const response = await apiClient.post<PaymentPlace>(BASE_PATH, data);
    return response.data;
  }

  async updatePaymentPlace(
    id: number,
    data: UpdatePaymentPlaceRequest
  ): Promise<PaymentPlace> {
    const response = await apiClient.put<PaymentPlace>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data;
  }

  async deletePaymentPlace(id: number): Promise<boolean> {
    const response = await apiClient.delete<boolean>(`${BASE_PATH}/${id}`);
    return response.data;
  }
}

export default new PaymentPlaceService();
