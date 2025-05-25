import apiClient from '../client';
import type { QueueParams, Queue } from '../types/queue';
import type { PaginatedResponse } from '../types/common';

class QueueService {
  async getQueues(params?: QueueParams): Promise<PaginatedResponse<Queue>> {
    const response = await apiClient.get<PaginatedResponse<Queue>>('/Queue', { params });
    return response.data;
  }

  async getQueueById(id: number): Promise<Queue> {
    const response = await apiClient.get<Queue>(`/Queue/${id}`);
    return response.data;
  }

  async createQueue(queue: Omit<Queue, 'id'>): Promise<Queue> {
    const response = await apiClient.post<Queue>('/Queue', queue);
    return response.data;
  }

  async updateQueue(id: number, queue: Partial<Queue>): Promise<Queue> {
    const response = await apiClient.put<Queue>(`/Queue/${id}`, queue);
    return response.data;
  }

  async deleteQueue(id: number): Promise<void> {
    await apiClient.delete(`/Queue/${id}`);
  }

  async closeQueue(id: number): Promise<void> {
    await apiClient.post(`/Queue/close/${id}`);
  }
}

export default new QueueService();