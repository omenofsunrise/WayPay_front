import { useState, useCallback } from 'react';
import analyticService from '../services/analyticService';
import type { 
  AnalyticParams, 
  AnalyticResponse, 
  SellInfoResponse,
  GraphResponse,
  DebtDynamicResponse
} from '../types/analytic';

const useAnalytic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticData, setAnalyticData] = useState<AnalyticResponse | null>(null);
  const [sellInfoData, setSellInfoData] = useState<SellInfoResponse | null>(null);
  const [investmentDynamicData, setInvestmentDynamicData] = useState<GraphResponse | null>(null);
  const [debtDynamicData, setDebtDynamicData] = useState<DebtDynamicResponse | null>(null);

  const getAnalyticItems = useCallback(async (params?: AnalyticParams): Promise<AnalyticResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticService.getAnalyticItems(params);
      setAnalyticData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSellInfo = useCallback(async (params?: AnalyticParams): Promise<SellInfoResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticService.getSellInfo(params);
      setSellInfoData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInvestmentDynamic = useCallback(async (params?: AnalyticParams): Promise<GraphResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticService.getInvestmentDynamic(params);
      setInvestmentDynamicData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDebtDynamic = useCallback(async (params?: AnalyticParams): Promise<DebtDynamicResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticService.getDebtDynamic(params);
      setDebtDynamicData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    analyticData,
    sellInfoData,
    investmentDynamicData,
    debtDynamicData,
    getAnalyticItems,
    getSellInfo,
    getInvestmentDynamic,
    getDebtDynamic,
  };
};

export default useAnalytic;