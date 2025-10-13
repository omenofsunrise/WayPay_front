import { useState, useCallback } from 'react';
import creditService from '../services/creditService';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs, UpdateCreditRequest, SetInvestmentSourceRequest, CreditListResponse } from '../types/credit';
import type { PaginatedResponse, PaginationParams } from '../types/common';

const useCredit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null | Error>(null);
  const [data, setData] = useState<CreditResponse | null>(null);
  const [investorCredits, setInvestorCredits] = useState<PaginatedResponse<Credit> | null>(null);

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
      const errorObj = err instanceof Error ? err : new Error('Failed to create credit');
      setError(errorObj);
      console.log(err);
      return null;
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
      setError(err instanceof Error ? err : 'Failed to create credit');
      console.log(err);
      return null;
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

  return {
    isLoading,
    error,
    data,
    investorCredits,
    getCredits,
    getCreditsByInvestorId,
    createCredit,
    toggleFavourite,
    deleteCredit,
    getDocsData,
    updateCredit,
    getCreateCreditRequest,
    setInvestmentSource,
    getCreditListByClient
  };
};

export default useCredit;