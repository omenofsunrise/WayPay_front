import type { InvestorPayout, CreateInvestorPayoutDto } from '../types/investorPayout';
import { API_BASE_URL } from '../client';

export const createInvestorPayout = async (dto: CreateInvestorPayoutDto): Promise<InvestorPayout> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to create investor payout');
  }

  return response.json();
};

export const deleteInvestorPayout = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete investor payout');
  }
};

export const getInvestorPayouts = async (investorId: number): Promise<InvestorPayout[]> => {
  const response = await fetch(`${API_BASE_URL}/investor/${investorId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch investor payouts');
  }

  return response.json();
};