import { useState, useCallback } from 'react';
import adminPanelService from '../services/adminPanelService';
import type { SendNotificationRequest } from '../types/notification';
import type { CreditApplicationUsersResponse } from '../types/applicationUser';

const useAdminPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditApplicationCompanies, setCreditApplicationCompanies] = useState<CreditApplicationUsersResponse[]>([]);

  const sendNotification = async (notificationData: SendNotificationRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.sendNotification(notificationData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditApplicationCompanies = async (): Promise<CreditApplicationUsersResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const companies = await adminPanelService.getCreditApplicationCompanies();
      setCreditApplicationCompanies(companies);
      return companies;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCreditApplicationCompany = async (name: string, phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.createCreditApplicationCompany({ name, phone });
      await fetchCreditApplicationCompanies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCreditApplicationCompany = async (id: string, name?: string, phone?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.updateCreditApplicationCompany({ id, name, phone });
      await fetchCreditApplicationCompanies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCreditApplicationCompany = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.deleteCreditApplicationCompany(id);
      setCreditApplicationCompanies(prev => prev.filter(company => company.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    creditApplicationCompanies,
    
    sendNotification,
    fetchCreditApplicationCompanies,
    createCreditApplicationCompany,
    updateCreditApplicationCompany,
    deleteCreditApplicationCompany,
    clearError,
  };
};

export default useAdminPanel;