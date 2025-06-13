import { useState, useCallback } from 'react';
import investorService from '../services/investorService';
import type { AutoSelectInvestorResponse, Investor, InvestorParams, InvestorReport } from '../types/investor';
import type { PaginatedResponse } from '../types/common';

const useInvestor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Investor> | null>(null);
  const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null);
  const [reportData, setReportData] = useState<any>(null);

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

  const getInvestorReport = useCallback(async (id: number): Promise<InvestorReport> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await investorService.getInvestorReport(id);
      setReportData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkInvestorCredits = async (id: number): Promise<boolean> => {
    try {
      const result = await investorService.CheckInvestorCredits(id);
      return result;
    }
    catch (err) {
    }
    finally {
    }
  }

  const blockInvestor = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await investorService.blockInvestor(id);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    finally {
      setIsLoading(false);
    }
  }

  const clearInvestor = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await investorService.clearInvestor(id);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    data,
    currentInvestor,
    reportData,
    getInvestors,
    getInvestorById,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    addInvestment,
    autoSelectInvestor,
    getInvestorReport,
    checkInvestorCredits,
    blockInvestor,
    clearInvestor
  };
};

export default useInvestor;