import { useState, useCallback } from "react";
import clientFeedbackService from "../services/clientFeedbackService";
import type { CreateClientFeedbackRequest } from "../types/clientFeedback";

const useClientFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeedback = useCallback(
    async (data: CreateClientFeedbackRequest): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);
      try {
        await clientFeedbackService.createFeedback(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { createFeedback, isSubmitting, error };
};

export default useClientFeedback;
