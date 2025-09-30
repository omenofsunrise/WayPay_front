import { useState, useCallback } from 'react';
import type { SoldProduct } from '../types/soldProduct';
import soldProductService from '../services/soldProductService';

const useSoldProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SoldProduct[] | null>(null);

  const getSoldProducts = useCallback(async (creditId: number): Promise<SoldProduct[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await soldProductService.getSoldProducts(creditId);
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
    getSoldProducts,
  };
};

export default useSoldProducts;