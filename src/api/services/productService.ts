import apiClient from '../client';
import type { Product, ProductParams } from '../types/product';
import type { PaginatedResponse } from '../types/common';

class ProductService {
  // Получение списка продуктов с пагинацией
  async getProducts(params?: ProductParams): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/Product', { params });
    return response.data;
  }

  // Получение одного продукта по ID
  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/Product/${id}`);
    return response.data;
  }

  // Создание продукта
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await apiClient.post<Product>('/Product', product);
    return response.data;
  }

  // Обновление продукта
  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/Product/${id}`, product);
    return response.data;
  }

  // Удаление продукта
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/Product/${id}`);
  }
}

export default new ProductService();