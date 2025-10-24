import { useState, useCallback } from 'react';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { NotificationResponse } from '../types/notification';
import notificationService from '../services/notificationService';

const useNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<NotificationResponse> | null>(null);

  const getMyNotifications = useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<NotificationResponse> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.getMyNotifications(params);
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
    getMyNotifications,
  };
};

export default useNotification;