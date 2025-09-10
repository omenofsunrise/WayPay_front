import { useState, useCallback } from 'react';
import blacklistService from '../services/blacklistService';
import type { Blacklist, BlacklistParams } from '../types/blacklist';
import type { PaginatedResponse } from '../types/common';

const useClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Blacklist> | null>(null);

  const getBlacklist = useCallback(async (params?: BlacklistParams): Promise<PaginatedResponse<Blacklist> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await blacklistService.getBlacklist(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBlacklist = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await blacklistService.addBlacklist(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFromBlacklist = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await blacklistService.deleteFromBlacklist(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };









  const getBlackCatalog = useCallback(async (params?: BlacklistParams): Promise<PaginatedResponse<Blacklist> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await blacklistService.getBlackCatalog(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBlackCatalog = async (clientData: Partial<Blacklist>) => {
    setIsLoading(true);
    setError(null);
    try {
      await blacklistService.addBlackCatalog(clientData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlackCatalog = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await blacklistService.updateBlackCatalog(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFromBlackCatalog = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await blacklistService.deleteFromBlackCatalog(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    getBlacklist,
    addBlacklist,
    deleteFromBlacklist,
    getBlackCatalog,
    addBlackCatalog,
    updateBlackCatalog,
    deleteFromBlackCatalog
  };
};

export default useClient;