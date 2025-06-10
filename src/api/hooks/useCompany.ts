import { useState, useCallback } from 'react';
import companyService from '../services/companyService';
import type { Company } from '../types/company';

const useCompany = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const getCompany = useCallback(async (): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getCompany();
      setCompany(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCompany = await companyService.updateCompany(companyData);
      setCompany(updatedCompany);
      return updatedCompany;
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
    company,
    getCompany,
    updateCompany,
  };
};

export default useCompany;