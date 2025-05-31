import apiClient from '../client';
import type { Product, ProductParams } from '../types/product';
import type { PaginatedResponse } from '../types/common';

class ProductService {
  async getProducts(params?: ProductParams): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/Product', { params });
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/Product/${id}`);
    return response.data;
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await apiClient.post<Product>('/Product', product);
    return response.data;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/Product/${id}`, product);
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/Product/${id}`);
  }
}

export default new ProductService();