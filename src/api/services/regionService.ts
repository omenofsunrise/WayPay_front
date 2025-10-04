import apiClient from '../client';
import type { District, Region } from '../types/region';

class RegionService {
  async getRegions(): Promise<Region[]> {
    const response = await apiClient.get<Region[]>('/Region');
    return response.data;
  }

  async getDistricts(id: number): Promise<District[]> {
    const response = await apiClient.get<District[]>(`/District/region-id/${id}`);
    return response.data;
  }
}

export default new RegionService();