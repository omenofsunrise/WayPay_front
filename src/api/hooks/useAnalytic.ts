import { useState, useCallback } from 'react';
import analyticService from '../services/analyticService';
import type { 
  AnalyticParams, 
  AnalyticResponse, 
  AnalyticSellsResponse 
} from '../types/analytic';

const useAnalytic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticData, setAnalyticData] = useState<AnalyticResponse | null>(null);
  const [sellInfoData, setSellInfoData] = useState<AnalyticSellsResponse | null>(null);

  const getAnalyticItems = useCallback(async (params?: AnalyticParams): Promise<AnalyticResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticService.getAnalyticItems({
        predefinedPeriod: params.predefinedPeriod,
        start: params.start,
        end: params.end
      });
      setAnalyticData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSellInfo = useCallback(async (params?: AnalyticParams): Promise<AnalyticSellsResponse | null> => {
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

  return {
    isLoading,
    error,
    analyticData,
    sellInfoData,
    getAnalyticItems,
    getSellInfo,
  };
};

export default useAnalytic;