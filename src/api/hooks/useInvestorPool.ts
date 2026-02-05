import { useState, useCallback } from 'react';
import investorPoolService from '../services/investorPoolService';
import type { 
  InvestorPool, 
  InvestorPoolRequest, 
  InvestorPoolParams,
  Reinvestment,
} from '../types/investorPool';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { InvestorReport } from '../types/investor';

const useInvestorPool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<InvestorPool> | null>(null);
  const [currentPool, setCurrentPool] = useState<InvestorPool | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const getInvestorPools = useCallback(async (params?: InvestorPoolParams): Promise<PaginatedResponse<InvestorPool> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await investorPoolService.getInvestorPools(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInvestorPoolReport = useCallback(async (id: number): Promise<InvestorReport> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await investorPoolService.getInvestorPoolReport(id);
        setReportData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
      }
  }, []);

  const createInvestorPool = async (request: InvestorPoolRequest, companyId: number): Promise<InvestorPool | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdPool = await investorPoolService.createInvestorPool(request, companyId);
      return createdPool;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvestorPoolName = async (id: number, newName: string): Promise<InvestorPool | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPool = await investorPoolService.updateInvestorPoolName(id, newName);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, name: newName } : item
        );
        setData({ ...data, items: updatedItems });
      }
      if (currentPool?.id === id) {
        setCurrentPool({ ...currentPool, name: newName });
      }
      return updatedPool;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvestorPoolPie = async (id: number, newPie: number): Promise<InvestorPool | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPool = await investorPoolService.updateInvestorPoolPie(id, newPie);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, pie: newPie } : item
        );
        setData({ ...data, items: updatedItems });
      }
      if (currentPool?.id === id) {
        setCurrentPool({ ...currentPool, pie: newPie });
      }
      return updatedPool;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reinvestInvestorPool = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await investorPoolService.reinvestInvestorPool(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getReinvestments = async (poolId: number, params: PaginationParams, investorId: number): Promise<PaginatedResponse<Reinvestment> | null> => {
    console.log('ADSKJDLAKSHDKLJKJH GHJ ПОСОМТРИ РПОСОСО СОРОРОСОСО');
    setIsLoading(true);
    setError(null);
    try {
      return await investorPoolService.getReinvestments(poolId, params, investorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvestorPool = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await investorPoolService.deleteInvestorPool(id);
      if (data) {
        const filteredItems = data.items.filter(item => item.id !== id);
        setData({ ...data, items: filteredItems });
      }
      if (currentPool?.id === id) {
        setCurrentPool(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    currentPool,
    getInvestorPools,
    createInvestorPool,
    updateInvestorPoolName,
    updateInvestorPoolPie,
    deleteInvestorPool,
    reportData,
    getInvestorPoolReport,
    reinvestInvestorPool,
    getReinvestments
  };
};

export default useInvestorPool;