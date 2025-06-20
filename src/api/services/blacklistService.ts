import apiClient from '../client';
import type { Blacklist, BlacklistParams } from '../types/blacklist';
import type { PaginatedResponse } from '../types/common';

class BlacklistService {
  async getBlacklist(params?: BlacklistParams): Promise<PaginatedResponse<Blacklist>> {
    const response = await apiClient.get<PaginatedResponse<Blacklist>>('/Client/blacklist', { params });
    return response.data;
  }

  async addBlacklist(id: number) {
    const response = await apiClient.put(`/Client/${id}/blacklist`);
    return response.data;
  }

  async deleteFromBlacklist(id: number) {
    const response = await apiClient.put(`Client/${id}/from_blacklist`);
    return response.data;
  }
}

export default new BlacklistService();