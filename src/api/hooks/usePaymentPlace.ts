import { useState, useCallback } from "react";
import axios from "axios";
import type {
  PaymentPlace,
  CreatePaymentPlaceRequest,
  UpdatePaymentPlaceRequest,
} from "../types/paymentPlace";
import paymentPlaceService from "../services/paymentPlaceService";

// Достаёт человекочитаемое сообщение из ошибки axios.
// Бэкенд может вернуть 400 с текстом вроде "Этот номер занят!"
const extractErrorMessage = (
  err: unknown,
  fallback = "Произошла ошибка"
): string => {
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

const usePaymentPlace = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPlaces, setPaymentPlaces] = useState<PaymentPlace[]>([]);

  const getPaymentPlaces = useCallback(
    async (silent = false): Promise<PaymentPlace[] | null> => {
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const result = await paymentPlaceService.getPaymentPlaces();
        setPaymentPlaces(result);
        return result;
      } catch (err) {
        setError(
          extractErrorMessage(
            err,
            "Не удалось загрузить пункты приёма платежей"
          )
        );
        return null;
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    []
  );

  const createPaymentPlace = async (
    data: CreatePaymentPlaceRequest
  ): Promise<PaymentPlace> => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await paymentPlaceService.createPaymentPlace(data);
      setPaymentPlaces((prev) => [...prev, created]);
      return created;
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Не удалось создать пункт приёма"
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentPlace = async (
    id: number,
    data: UpdatePaymentPlaceRequest
  ): Promise<PaymentPlace> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await paymentPlaceService.updatePaymentPlace(id, data);
      setPaymentPlaces((prev) =>
        prev.map((place) => (place.id === id ? updated : place))
      );
      return updated;
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Не удалось обновить пункт приёма"
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePaymentPlace = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentPlaceService.deletePaymentPlace(id);
      setPaymentPlaces((prev) => prev.filter((place) => place.id !== id));
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Не удалось удалить пункт приёма"
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    error,
    paymentPlaces,

    getPaymentPlaces,
    createPaymentPlace,
    updatePaymentPlace,
    deletePaymentPlace,
    clearError,
  };
};

export default usePaymentPlace;
