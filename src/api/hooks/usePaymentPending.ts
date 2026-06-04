import { useState, useCallback } from "react";
import axios from "axios";
import type {
  PaymentPending,
  PaymentPendingParams,
} from "../types/paymentPending";
import paymentPendingService from "../services/paymentPendingService";

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const candidate = obj.message ?? obj.title ?? obj.error;
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

const usePaymentPending = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentPending[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const getPaymentPendings = useCallback(
    async (params?: PaymentPendingParams): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await paymentPendingService.getPaymentPendings(params);
        setItems(data);
      } catch (err) {
        setError(
          extractErrorMessage(err, "Не удалось загрузить платежи с приёмки")
        );
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const confirmPayment = useCallback(async (id: number): Promise<void> => {
    setProcessingId(id);
    setError(null);
    try {
      await paymentPendingService.confirm(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err, "Не удалось подтвердить платёж"));
      throw err;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const rejectPayment = useCallback(async (id: number): Promise<void> => {
    setProcessingId(id);
    setError(null);
    try {
      await paymentPendingService.reject(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err, "Не удалось отклонить платёж"));
      throw err;
    } finally {
      setProcessingId(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    error,
    items,
    processingId,

    getPaymentPendings,
    confirmPayment,
    rejectPayment,
    clearError,
  };
};

export default usePaymentPending;
