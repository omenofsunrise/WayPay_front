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

  const prepareParams = useCallback((params?: AnalyticParams) => {
    if (!params) return undefined;
    
    if (params.predefinedPeriod === 'Custom') {
      return {
        start: params.start,
        end: params.end
      };
    }
    
    return {
      predefinedPeriod: params.predefinedPeriod
    };
  }, []);

  const getAnalyticItems = useCallback(async (params?: AnalyticParams): Promise<AnalyticResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const preparedParams = prepareParams(params);
      const result = await analyticService.getAnalyticItems(preparedParams);
      setAnalyticData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [prepareParams]);

  const getSellInfo = useCallback(async (params?: AnalyticParams): Promise<SellInfoResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const preparedParams = prepareParams(params);
      const result = await analyticService.getSellInfo(preparedParams);
      setSellInfoData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [prepareParams]);

  const getInvestmentDynamic = useCallback(async (params?: AnalyticParams): Promise<GraphResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const preparedParams = prepareParams(params);
      const result = await analyticService.getInvestmentDynamic(preparedParams);
      setInvestmentDynamicData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [prepareParams]);

  const getDebtDynamic = useCallback(async (params?: AnalyticParams): Promise<DebtDynamicResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const preparedParams = prepareParams(params);
      const result = await analyticService.getDebtDynamic(preparedParams);
      setDebtDynamicData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [prepareParams]);

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