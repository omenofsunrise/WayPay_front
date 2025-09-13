import { useState, useCallback } from 'react';
import type { Guarantor } from '../types/client';
import guarantorService from '../services/guarantorService';

const useGuarantor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGuarantorById = useCallback(async (id: number): Promise<Guarantor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await guarantorService.getGuarantorById(id);
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
    getGuarantorById,
  };
};

export default useGuarantor;