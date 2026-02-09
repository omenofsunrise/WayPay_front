import { useState, useCallback } from 'react';
import type { BankCard, BankCardFilters, BankCardRequest } from '../types/bankCard';
import type { PagedResult } from '../types/objectType';
import bankCardService from '../services/bankCardService';

const useBankCards = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankCards, setObjectTypes] = useState<BankCard[]>([]);
  const [pagedResult, setPagedResult] = useState<PagedResult<BankCard> | null>(null);

  const getAll = useCallback(async (filters?: BankCardFilters): Promise<PagedResult<BankCard> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await bankCardService.getAll(filters);
      setObjectTypes(result.items);
      setPagedResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (bankCardData: BankCardRequest): Promise<BankCard | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await bankCardService.create(bankCardData);
      setObjectTypes(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, updateData: BankCardRequest): Promise<BankCard | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await bankCardService.update(id, updateData);
      setObjectTypes(prev => prev.map(ot => ot.id === id ? result : ot));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBankCard = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await bankCardService.delete(id);
      setObjectTypes(prev => prev.filter(ot => ot.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    bankCards,
    pagedResult,
    getAll,
    create,
    update,
    deleteBankCard,
    clearError: () => setError(null),
    clearObjectTypes: () => {
      setObjectTypes([]);
      setPagedResult(null);
    },
  };
};

export default useBankCards;