import { useState, useCallback } from 'react';
import creditService from '../services/creditService';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs, UpdateCreditRequest, SetInvestmentSourceRequest, CreditListResponse } from '../types/credit';
import type { PaginatedResponse, PaginationParams } from '../types/common';

const useCredit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null | Error>(null);
  const [data, setData] = useState<CreditResponse | null>(null);
  const [investorCredits, setInvestorCredits] = useState<PaginatedResponse<Credit> | null>(null);

  const getCredits = useCallback(async (
    params?: CreditParams,
    signal?: AbortSignal
  ): Promise<CreditResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await creditService.getCredits(params, signal);
      
      // Проверяем, не был ли запрос отменен
      if (signal?.aborted) {
        console.log('Request was aborted, skipping state update');
        return null;
      }
      
      setData(result);
      return result;
    } catch (err) {
      // Игнорируем ошибки от отмененных запросов
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted, skipping error state');
        return null;
      }
      
      // Обновляем состояние ошибки только если запрос не был отменен
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      
      return null;
    } finally {
      // Устанавливаем isLoading в false только если запрос не был отменен
      // или если это был последний запрос
      if (!signal?.aborted) {
        setIsLoading(false);
      } else {
        // Даже для отмененных запросов нужно сбросить isLoading,
        // но только если нет активных запросов
        setIsLoading(false);
      }
    }
  }, []);

  const getCreditsByInvestorId = useCallback(async (
    investorId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Credit> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCreditsByInvestorId(investorId, page, pageSize);
      setInvestorCredits(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch investor credits');
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
      setError(err instanceof Error ? err : new Error('Failed to create credit'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCredit = useCallback(async (creditData: UpdateCreditRequest): Promise<Credit | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.updateCredit(creditData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update credit'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocsData = useCallback(async (id?: number): Promise<CreditDocs | null> => {
    if (!id) return null;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getSpaData(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SPA data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreateCreditRequest = useCallback(async (id?: number): Promise<CreateCreditRequest | null> => {
    if (!id) return null;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCreditCreateRequest(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SPA data');
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
      setInvestorCredits(prev => {
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

  const toggleTerminated = useCallback(async (id: number): Promise<boolean> => {
    try {
      await creditService.toggleTerminated(id);
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(credit =>
            credit.id === id ? { ...credit, terminated: !credit.terminated } : credit
          )
        };
      });
      setInvestorCredits(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(credit =>
            credit.id === id ? { ...credit, terminated: !credit.terminated } : credit
          )
        };
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle terminated');
      return false;
    }
  }, []);

  const acceptCredit = useCallback(async (id: number) => {
    try {
      await creditService.acceptCredit(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }, []);

  const acceptCredits = useCallback(async (params?: CreditParams) => {
    setIsLoading(true);
    setError(null);
    try {
      await creditService.acceptCredits(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const setCreditType = useCallback(async (creditId: number, typeId?: number | null) => {
    try {
      await creditService.setCreditType(creditId, typeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set');
    }
  }, []);

  const setCategory = useCallback(async (creditId: number, typeId?: number | null) => {
    try {
      await creditService.setCategory(creditId, typeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set category');
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

  const setInvestmentSource = useCallback(async (
    creditId: number, 
    sourceRequest: SetInvestmentSourceRequest
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await creditService.setInvestmentSource(creditId, sourceRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set investment source');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreditListByClient = useCallback(async (id: number, params?: PaginationParams): Promise<PaginatedResponse<CreditListResponse> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCreditListByClient(id, params);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SPA data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreditById = useCallback(async (id: number): Promise<Credit | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCreditById(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SPA data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    setData,
    investorCredits,
    getCredits,
    getCreditsByInvestorId,
    createCredit,
    toggleFavourite,
    toggleTerminated,
    deleteCredit,
    getDocsData,
    updateCredit,
    getCreateCreditRequest,
    setInvestmentSource,
    getCreditListByClient,
    getCreditById,
    setCategory,
    setCreditType,
    acceptCredit,
    acceptCredits
  };
};

export default useCredit;
