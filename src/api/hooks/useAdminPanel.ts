import { useState, useCallback } from 'react';
import adminPanelService from '../services/adminPanelService';
import type { SendNotificationRequest } from '../types/notification';

const useAdminPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = async (notificationData: SendNotificationRequest): Promise<SendNotificationRequest | null> => {
    setIsLoading(true);
    setError(null);
    try {
      await adminPanelService.SendNotification(notificationData);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
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
    
    sendNotification,
    clearError,
  };
};

export default useAdminPanel;