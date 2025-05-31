import { useState, useCallback } from 'react';
import investorService from '../services/investorService';
import type { AutoSelectInvestorResponse, Investor, InvestorParams } from '../types/investor';
import type { PaginatedResponse } from '../types/common';

const useInvestor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Investor> | null>(null);
  const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null);

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

  const getInvestorById = useCallback(async (id: number): Promise<Investor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await investorService.getInvestorById(id);
      setCurrentInvestor(result);
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
      if (currentInvestor?.id === id) {
        setCurrentInvestor({ ...currentInvestor, ...updatedInvestor });
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
      if (currentInvestor?.id === id) {
        setCurrentInvestor(null);
      }
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
      if (currentInvestor?.id === id) {
        setCurrentInvestor(updatedInvestor);
      }
      return updatedInvestor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const autoSelectInvestor = async (totalProductAmount: number): Promise<AutoSelectInvestorResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedInvestor = await investorService.autoSelectInvestor(totalProductAmount);
      return selectedInvestor;
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
    currentInvestor,
    getInvestors,
    getInvestorById,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    addInvestment,
    autoSelectInvestor
  };
};

export default useInvestor;