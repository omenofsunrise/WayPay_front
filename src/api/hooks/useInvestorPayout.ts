import { useState } from 'react';
import type {
  InvestorPayout,
  CreateInvestorPayoutDto,
} from '../types/investorPayout';
import {
  createInvestorPayout,
  deleteInvestorPayout,
  getInvestorPayouts,
} from '../services/investorPayoutService';

export const useInvestorPayout = () => {
  const [payouts, setPayouts] = useState<InvestorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async (investorId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvestorPayouts(investorId);
      setPayouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const addPayout = async (dto: CreateInvestorPayoutDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPayout = await createInvestorPayout(dto);
      setPayouts((prev) => [...prev, newPayout]);
      return newPayout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removePayout = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteInvestorPayout(id);
      setPayouts((prev) => prev.filter((payout) => payout.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    payouts,
    isLoading,
    error,
    fetchPayouts,
    addPayout,
    removePayout,
  };
};