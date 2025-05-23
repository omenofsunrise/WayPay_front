import apiClient from '../client';
import type { Client, ClientParams } from '../types/client';
import type { PaginatedResponse } from '../types/common';

class ClientService {
  async getClients(params?: ClientParams): Promise<PaginatedResponse<Client>> {
    const response = await apiClient.get<PaginatedResponse<Client>>('/Client/paged', { params });
    return response.data;
  }

  async getClientById(id: number): Promise<Client> {
    const response = await apiClient.get<Client>(`/Client/${id}`);
    return response.data;
  }

  async createClient(client: Omit<Client, 'id'>): Promise<Client> {
    const response = await apiClient.post<Client>('/Client', client);
    return response.data;
  }

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    const response = await apiClient.put<Client>(`/Client/${id}`, client);
    return response.data;
  }

  async deleteClient(id: number): Promise<void> {
    await apiClient.delete(`/Client/${id}`);
  }
}

export default new ClientService();