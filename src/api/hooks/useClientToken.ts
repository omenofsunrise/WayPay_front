import { useState, useCallback } from "react";
import clientTokenService from "../services/clientTokenService";
import type {
  PublicClientDto,
  TemporaryTokenResponse,
} from "../types/clientToken";

const useClientToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTemporaryToken = useCallback(
    async (clientId: number): Promise<TemporaryTokenResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await clientTokenService.generateTemporaryToken(clientId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getClientByTemporaryToken = useCallback(
    async (token: string): Promise<PublicClientDto | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await clientTokenService.getClientByTemporaryToken(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generateTemporaryToken,
    getClientByTemporaryToken,
    isLoading,
    error,
  };
};

export default useClientToken;
