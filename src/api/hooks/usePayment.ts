import { useState, useCallback } from 'react';
import paymentService from '../services/paymentService';
import type { Payment, PaymentParams } from '../types/payment';
import type { PaginatedResponse } from '../types/common';

const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Payment> | null>(null);

  const getPayments = useCallback(async (params?: PaymentParams): Promise<PaginatedResponse<Payment> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPayments(params);
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
    getPayments,
  };
};

export default usePayment;