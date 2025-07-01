import { useState, useCallback } from 'react';
import creditService from '../services/creditService';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs } from '../types/credit';

const useCredit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreditResponse | null>(null);

  const getCredits = useCallback(async (params?: CreditParams): Promise<CreditResponse | null> => {
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

  const getDocsData = useCallback(async (id?: number): Promise<CreditDocs | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
    deleteCredit,
    getDocsData
  };
};

export default useCredit;