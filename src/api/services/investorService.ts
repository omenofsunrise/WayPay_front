import apiClient from '../client';
import type { Investor, InvestorParams } from '../types/investor';
import type { PaginatedResponse } from '../types/common';

class ProductService {
  async getInvestors(params?: InvestorParams): Promise<PaginatedResponse<Investor>> {
    const response = await apiClient.get<PaginatedResponse<Investor>>('/Investor', { params });
    return response.data;
  }

  async getInvestorById(id: number): Promise<Investor> {
    const response = await apiClient.get<Investor>(`/Investor/${id}`);
    return response.data;
  }

  async createInvestor(investor: Omit<Investor, 'id'>): Promise<Investor> {
    const response = await apiClient.post<Investor>('/Investor', investor);
    return response.data;
  }

  async updateInvestor(id: number, investor: Partial<Investor>): Promise<Investor> {
    const response = await apiClient.put<Investor>(`/Investor/${id}`, investor);
    return response.data;
  }

  async deleteInvestor(id: number): Promise<void> {
    await apiClient.delete(`/Investor/${id}`);
  }

  async addInvestment(id: number, amount: number): Promise<Investor> {
    const response = await apiClient.put<Investor>(`/api/Investor/${id}/add-investment`, { amount });
    return response.data;
  }
}

export default new ProductService();