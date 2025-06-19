import { useState, useCallback } from 'react';
import companyService from '../services/companyService';
import type { Company } from '../types/company';

const useCompany = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

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

  const getCompanyById = useCallback(async (id: number): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getCompanyById(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllCompanies = useCallback(async (): Promise<Company[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getAllCompanies();
      setCompanies(result);
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

  const updateCompanyById = async (id: number, companyData: Partial<Company>): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCompany = await companyService.updateCompanyById(id, companyData);
      return updatedCompany;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCompany = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await companyService.deleteCompany(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (companyData: {
    AdminPhone: string;
    LicenceDate: Date;
  }): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newCompany = await companyService.createCompany(companyData);
      return newCompany;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const changeLicenceDate = useCallback(async (id: number, licenceDate: Date): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Преобразуем Date в строку в нужном формате (например, 'yyyy-MM-dd')
      const success = await companyService.changeLicenceDate(id, licenceDate);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePhone = useCallback(async (id: number, phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await companyService.changePhone(id, phone);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    company,
    companies,
    getCompany,
    getCompanyById,
    getAllCompanies,
    updateCompany,
    updateCompanyById,
    deleteCompany,
    createCompany,
    changeLicenceDate,
    changePhone
  };
};

export default useCompany;