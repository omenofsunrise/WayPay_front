import { useState, useCallback } from 'react';
import companyService from '../services/companyService';
import type { CommonInfo, CompaneAccountDetails, Company } from '../types/company';

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

  const getCommonInfo = useCallback(async (): Promise<CommonInfo | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getCommonInfo();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccountDetails = useCallback(async (): Promise<CompaneAccountDetails | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getAccountDetails();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllCompanies = useCallback(async (isPartner: boolean): Promise<Company[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getAllCompanies(isPartner);
      setCompanies(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const payoutPartner = async (partnerId: number, amount: number) : Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await companyService.payoutPartner(partnerId, amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }    
  }

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
    AdminName: string;
    CompanyName: string;
    IsPartner: boolean;
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
      const success = await companyService.changeLicenceDate(id, licenceDate);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCompanyPhoto = useCallback(async (photo: File): Promise<Company | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCompany = await companyService.updateCompanyPhoto(photo);
      setCompany(prev => prev ? {...prev, photoPath: updatedCompany.photoPath} : null);
      return updatedCompany;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCompanyPhoto = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await companyService.deleteCompanyPhoto();
      setCompany(prev => prev ? {...prev, photoPath: undefined} : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCompanyPhotoUrl = useCallback((photoPath?: string): string | null => {
    return companyService.getCompanyPhotoUrl(photoPath);
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
    changePhone,
    updateCompanyPhoto,
    deleteCompanyPhoto,
    getCompanyPhotoUrl,
    getCommonInfo,
    getAccountDetails,
    payoutPartner
  };
};

export default useCompany;