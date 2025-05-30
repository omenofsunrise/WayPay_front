// hooks/useCredit.ts
import { useState, useCallback } from 'react';
import creditService from '../services/creditService';
import type { Credit, CreditParams, CreateCreditRequest } from '../types/credit';
import type { PaginatedResponse } from '../types/common';

const useCredit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Credit> | null>(null);

  const getCredits = useCallback(async (params?: CreditParams): Promise<PaginatedResponse<Credit> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCredits(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCredit = useCallback(async (creditData: CreateCreditRequest): Promise<Credit | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.createCredit(creditData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credit');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavourite = useCallback(async (id: number) => {
    try {
      await creditService.toggleCredit(id);
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(credit => 
            credit.id === id ? { ...credit, isFavourite: !credit.isFavourite } : credit
          )
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }, []);

  const deleteCredit = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await creditService.deleteCredit(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    data,
    getCredits,
    createCredit,
    toggleFavourite,
    deleteCredit
  };
};

export default useCredit;