import apiClient from '../client';
import type { AutoSelectInvestorResponse, Investor, InvestorAgreementResponse, InvestorParams, InvestorReport } from '../types/investor';
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

  async addInvestment(id: number, amount: number, date: Date): Promise<Investor> {
    const response = await apiClient.put<Investor>(`Investor/${id}/add-investment`, { amount, date });
    return response.data;
  }

  async autoSelectInvestor(totalProductAmount: number, lastPaymentDay: Date): Promise<AutoSelectInvestorResponse> {
    const response = await apiClient.post<AutoSelectInvestorResponse>(
      '/Investor/auto-select',
      { totalProductAmount, lastPaymentDay }
    );
    return response.data;
  }

  async getInvestorReport(id: number): Promise<InvestorReport> {
    const response = await apiClient.get(`/Investor/report/${id}`);
    return response.data;
  }

  async getInvestorAgreement(id: number): Promise<InvestorAgreementResponse> {
    const response = await apiClient.get(`/Investor/agreement/${id}`);
    return response.data;
  }

  async CheckInvestorCredits(id: number): Promise<boolean> {
    const result = await apiClient.get(`/Investor/have_credits/${id}`);
    return result.data;
  }

  async blockInvestor(id: number): Promise<void> {
    await apiClient.patch(`/Investor/toggle-block/${id}`);
  }

  async clearInvestor(id: number): Promise<void> {
    await apiClient.patch(`/Investor/clear/${id}`);
  }
}

export default new ProductService();