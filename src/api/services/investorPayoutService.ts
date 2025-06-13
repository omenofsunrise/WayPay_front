import type { InvestorPayout, CreateInvestorPayoutDto } from '../types/investorPayout';
import apiClient from '../client';

export const createInvestorPayout = async (dto: CreateInvestorPayoutDto): Promise<InvestorPayout> => {
  try {
    const response = await apiClient.post<InvestorPayout>('/InvestorPayouts', dto);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create investor payout');
  }
};

export const deleteInvestorPayout = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/InvestorPayouts/${id}`);
  } catch (error) {
    throw new Error('Failed to delete investor payout');
  }
};

export const getInvestorPayouts = async (investorId: number): Promise<InvestorPayout[]> => {
  try {
    const response = await apiClient.get<InvestorPayout[]>(`/InvestorPayouts/investor/${investorId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch investor payouts');
  }
};