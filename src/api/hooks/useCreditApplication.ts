import { useState, useCallback } from 'react';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { CreditApplicationResponse } from '../types/creditApplication';
import creditApplicationService from '../services/creditApplicationService';

const useCreditApplication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<CreditApplicationResponse> | null>(null);

  const getCreditApplications = useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<CreditApplicationResponse> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditApplicationService.getCreditApplications(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveCreditApplication = useCallback(async (id: number) => {
    try {
          await creditApplicationService.acceptCreditApplications(id);
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
    getCreditApplications,
    approveCreditApplication,
  };
};

export default useCreditApplication;