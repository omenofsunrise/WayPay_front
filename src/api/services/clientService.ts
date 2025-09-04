import apiClient from '../client';
import type { Client, ClientExistsResponse, ClientParams, PassportPhotoResponse } from '../types/client';
import type { PaginatedResponse } from '../types/common';

class ClientService {
  async getClients(params?: ClientParams): Promise<PaginatedResponse<Client>> {
    const response = await apiClient.get<PaginatedResponse<Client>>('/Client', { params });
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

  async updateClientDoc(id: number, doc: string): Promise<void> {
    await apiClient.put(`/Client/${id}/doc`, { doc });
  }

  async updateClientDocIssueDate(id: number, docIssueDate: Date): Promise<void> {
    await apiClient.put(`/Client/${id}/doc-issue-date`, { docIssueDate });
  }

  async checkClientExists(phone: string): Promise<boolean> {
    const response = await apiClient.get<ClientExistsResponse>('/Client/exists', { 
      params: { phone } 
    });
    return response.data.exists;
  }

  async CheckClientCredits(id: number): Promise<boolean> {
    const result = await apiClient.get(`/Client/have_credits/${id}`);
    return result.data;
  }

  async uploadPassportPhoto(id: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    await apiClient.post(`/Client/${id}/passport-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getPassportPhoto(id: number): Promise<PassportPhotoResponse> {
    const response = await apiClient.get<PassportPhotoResponse>(`/Client/${id}/passport-photo`);
    return response.data;
  }

  async deletePassportPhoto(id: number): Promise<void> {
    await apiClient.delete(`/Client/${id}/passport-photo`);
  }
}

export default new ClientService();