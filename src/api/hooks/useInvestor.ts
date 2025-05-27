import { useState, useCallback } from 'react';
import investorService from '../services/investorService';
import type { Investor, InvestorParams } from '../types/investor';
import type { PaginatedResponse } from '../types/common';

const useInvestor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Investor> | null>(null);

  const getInvestors = useCallback(async (params?: InvestorParams): Promise<PaginatedResponse<Investor> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await investorService.getInvestors(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvestor = async (investor: Omit<Investor, 'id'>): Promise<Investor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdInvestor = await investorService.createInvestor(investor);
      return createdInvestor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvestor = async (id: number, investor: Partial<Investor>): Promise<Investor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedInvestor = await investorService.updateInvestor(id, investor);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, ...updatedInvestor } : item
        );
        setData({ ...data, items: updatedItems });
      }
      return updatedInvestor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvestor = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await investorService.deleteInvestor(id);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    finally {
      setIsLoading(false);
    }
  }

  const addInvestment = async (id: number, amount: number): Promise<Investor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedInvestor = await investorService.addInvestment(id, amount);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? updatedInvestor : item
        );
        setData({ ...data, items: updatedItems });
      }
      return updatedInvestor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    getInvestors,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    addInvestment
  };
};

export default useInvestor;