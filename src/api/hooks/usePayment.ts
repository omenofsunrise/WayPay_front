import { useState, useCallback } from 'react';
import paymentService from '../services/paymentService';
import type { Payment, PaymentParams, CreatePaymentRequest, PaymentByCreditParams, PaymentTab } from '../types/payment';
import type { PaginatedResponse } from '../types/common';

const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentResponse | null>(null);

  const getPayments = useCallback(async (params?: PaymentParams): Promise<PaymentResponse | null> => {
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

  const getPaymentTab = useCallback(async (paymentId: number): Promise<PaymentTab | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentTab(paymentId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentsByCreditId = useCallback(async (params: PaymentByCreditParams): Promise<PaginatedResponse<Payment> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentsByCreditId(params);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (paymentData: CreatePaymentRequest): Promise<Payment | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.createPayment(paymentData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentService.confirmPayment(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(id);
      return true;
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
    data,
    getPayments,
    getPaymentsByCreditId,
    createPayment,
    confirmPayment,
    deletePayment,
    getPaymentTab
  };
};

export default usePayment;