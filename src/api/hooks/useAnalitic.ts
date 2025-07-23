import { useState, useCallback } from 'react';
import analiticService from '../services/analiticService';
import type { AnalyticParams, AnalyticResponse } from '../types/analityc';

const useAnalitic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticResponse | null>(null);

  const getAnalyticItems = useCallback(async (params?: AnalyticParams): Promise<AnalyticResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analiticService.getAnalyticItems(params);
      setData(result);
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
    data,
    getAnalyticItems,
  };
};

export default useAnalitic;