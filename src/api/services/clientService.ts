import apiClient from '../client';
import type {
  Client,
  ClientContact,
  ClientExistsResponse,
  ClientParams,
  CreateContactRequest,
  PassportPhotoResponse,
  PassportPhotoType,
  UpdateContactRequest,
  UploadPhotoResponse,
} from '../types/client';
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

  async addToBlacklist(id: number): Promise<void> {
    await apiClient.put(`/Client/${id}/to_blacklist`);
  }

  async removeFromBlacklist(id: number): Promise<void> {
    await apiClient.put(`/Client/${id}/from_blacklist`);
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

  async uploadPassportPhoto(id: number, file: File, photoType: PassportPhotoType): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('photoType', photoType.toString());
    
    const response = await apiClient.post<UploadPhotoResponse>(`/Client/${id}/passport-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPassportPhoto(id: number, photoType: PassportPhotoType): Promise<PassportPhotoResponse> {
    const response = await apiClient.get<PassportPhotoResponse>(`/Client/${id}/passport-photo`, {
      params: { photoType }
    });
    return response.data;
  }

  async deletePassportPhoto(id: number, photoType: PassportPhotoType): Promise<void> {
    await apiClient.delete(`/Client/${id}/passport-photo`, {
      params: { photoType }
    });
  }

  async createContact(request: CreateContactRequest): Promise<ClientContact | null> {
    const response = await apiClient.post<ClientContact | null>('/Client/contact', request);
    return response.data ?? null;
  }

  async updateContact(request: UpdateContactRequest): Promise<ClientContact | null> {
    const response = await apiClient.put<ClientContact | null>('/Client/contact', request);
    return response.data ?? null;
  }

  async deleteContact(id: number): Promise<void> {
    await apiClient.delete(`/Client/contact/${id}`);
  }
}

export default new ClientService();
