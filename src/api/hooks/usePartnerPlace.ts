import { useState, useCallback, useRef } from "react";
import axios from "axios";
import type { Credit } from "../types/credit";
import type {
  PaymentPending,
  CreatePaymentPendingRequest,
} from "../types/paymentPending";
import partnerPlaceService from "../services/partnerPlaceService";
import { extractErrorMessage } from "../utils/errorMessage";

const usePartnerPlace = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Credit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const searchContracts = useCallback(async (search: string): Promise<void> => {
    const trimmed = search.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setError(null);
    try {
      const data = await partnerPlaceService.searchContracts(
        trimmed,
        controller.signal
      );
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(
        extractErrorMessage(err, "Не удалось выполнить поиск договоров")
      );
      setResults([]);
      setHasSearched(true);
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  }, []);

  const addPayment = useCallback(
    async (data: CreatePaymentPendingRequest): Promise<PaymentPending> => {
      setIsSubmitting(true);
      setError(null);
      try {
        return await partnerPlaceService.createPaymentPending(data);
      } catch (err) {
        const message = extractErrorMessage(err, "Не удалось добавить платёж");
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const deletePayment = useCallback(async (id: number): Promise<void> => {
    setError(null);
    try {
      await partnerPlaceService.deletePaymentPending(id);
    } catch (err) {
      const message = extractErrorMessage(err, "Не удалось удалить платёж");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isSearching,
    isSubmitting,
    error,
    results,
    hasSearched,

    searchContracts,
    addPayment,
    deletePayment,
    clearError,
  };
};

export default usePartnerPlace;
