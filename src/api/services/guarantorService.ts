import apiClient from '../client';
import type { Client, ClientExistsResponse, ClientParams, Guarantor, PassportPhotoResponse } from '../types/client';

class GuarantorService {
  async getGuarantorById(id: number): Promise<Guarantor> {
    const response = await apiClient.get<Guarantor>(`/Guarantor/${id}`);
    return response.data;
  }
}

export default new GuarantorService();