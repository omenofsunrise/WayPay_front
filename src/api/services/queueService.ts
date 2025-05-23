import apiClient from '../client';
import type { QueueParams, Queue } from '../types/queue';
import type { PaginatedResponse } from '../types/common';

class ProductService {
  // Получение списка очередей с пагинацией
  async getQueues(params?: QueueParams): Promise<PaginatedResponse<Queue>> {
    const response = await apiClient.get<PaginatedResponse<Queue>>('/Product', { params });
    return response.data;
  }

  // Получение одной очереди по ID
  async getQueueById(id: number): Promise<Queue> {
    const response = await apiClient.get<Queue>(`/Queue/${id}`);
    return response.data;
  }

  // Создание очереди
  async createQueue(product: Omit<Queue, 'id'>): Promise<Queue> {
    const response = await apiClient.post<Queue>('/Queue', product);
    return response.data;
  }

  // Обновление очереди
  async updateQueue(id: number, product: Partial<Queue>): Promise<Queue> {
    const response = await apiClient.put<Queue>(`/Queue/${id}`, product);
    return response.data;
  }

  // Удаление очереди
  async deleteQueue(id: number): Promise<void> {
    await apiClient.delete(`/Queue/${id}`);
  }

  // закрытие очереди
  async closeQueue(id: number): Promise<void> {
    await apiClient.delete(`/Queue/${id}`);
  }
}

export default new ProductService();