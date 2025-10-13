import { useState, useCallback } from 'react';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { InvestorContribution } from '../types/investorContribution';
import investorContributionService from '../services/investorContributionService';

const useInvestorContribution = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<InvestorContribution> | null>(null);

  const getProducts = useCallback(async (investorId: number, params: PaginationParams): Promise<PaginatedResponse<InvestorContribution> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await investorContributionService.getInvestorContributions(investorId, params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeAction = useCallback(async (id: number, action: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await investorContributionService.makeAction(id, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    getProducts,
    makeAction
  };
};

export default useInvestorContribution;