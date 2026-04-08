import { useState, useCallback } from 'react';
import type { CancelSubscriptionResponse, CreateSubscriptionResponse } from '../services/subscriptionService';
import subscriptionService from '../services/subscriptionService';

interface UseSubscriptionOptions {
  autoRedirect?: boolean;
  openInNewTab?: boolean;
  onSuccess?: (data: CreateSubscriptionResponse) => void;
  onCancel?: (data: CancelSubscriptionResponse) => void;
  onError?: (error: string) => void;
}

interface UseSubscriptionReturn {
  isLoading: boolean;
  isSubscribing: boolean;
  isCancelling: boolean;
  error: string | null;
  subscriptionData: CreateSubscriptionResponse | null;
  cancelData: CancelSubscriptionResponse | null;
  subscribe: (days: number) => Promise<CreateSubscriptionResponse | null>;
  cancelSubscription: () => Promise<CancelSubscriptionResponse | null>;
  resetState: () => void;
}

const useSubscription = (options: UseSubscriptionOptions = {}): UseSubscriptionReturn => {
  const {
    autoRedirect = false,
    openInNewTab = false,
    onSuccess,
    onCancel,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<CreateSubscriptionResponse | null>(null);
  const [cancelData, setCancelData] = useState<CancelSubscriptionResponse | null>(null);

  /**
   * Создание подписки
   */
  const subscribe = useCallback(async (days: number): Promise<CreateSubscriptionResponse | null> => {
    setIsSubscribing(true);
    setIsLoading(true);
    setError(null);
    setSubscriptionData(null);
    
    try {      
      const result = await subscriptionService.subscribe(days);
      setSubscriptionData(result);
      
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsSubscribing(false);
      setIsLoading(false);
    }
  }, [autoRedirect, onSuccess, onError]);

  /**
   * Отмена подписки
   */
  const cancelSubscription = useCallback(async (): Promise<CancelSubscriptionResponse | null> => {
    setIsCancelling(true);
    setIsLoading(true);
    setError(null);
    setCancelData(null);
    
    try {
      const result = await subscriptionService.cancelSubscription();
      setCancelData(result);
      onCancel?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsCancelling(false);
      setIsLoading(false);
    }
  }, [onCancel, onError]);

  /**
   * Сброс состояния
   */
  const resetState = useCallback(() => {
    setIsLoading(false);
    setIsSubscribing(false);
    setIsCancelling(false);
    setError(null);
    setSubscriptionData(null);
    setCancelData(null);
  }, []);

  return {
    isLoading,
    isSubscribing,
    isCancelling,
    error,
    subscriptionData,
    cancelData,
    subscribe,
    cancelSubscription,
    resetState,
  };
};

export default useSubscription;