import apiClient from '../client';
import type { PaginatedResponse } from '../types/common';
import type { SoldProduct } from '../types/soldProduct';

class ProductService {
  async getSoldProducts(creditId: number): Promise<SoldProduct[]> {
    const response = await apiClient.get<SoldProduct[]>(`/SoldProduct/by-credit/${creditId}`);
    return response.data;
  }
}

export default new ProductService();