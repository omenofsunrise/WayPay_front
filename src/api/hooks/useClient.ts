import { useState, useCallback } from 'react';
import clientService from '../services/clientService';
import type { Client, ClientParams } from '../types/client';
import type { PaginatedResponse } from '../types/common';

const useClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);

  const getClients = useCallback(async (params?: ClientParams): Promise<PaginatedResponse<Client> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientService.getClients(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClient = async (client: Omit<Client, 'id'>): Promise<Client | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdClient = await clientService.createClient(client);
      return createdClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: number, client: Partial<Client>): Promise<Client | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedClient = await clientService.updateClient(id, client);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, ...updatedClient } : item
        );
        setData({ ...data, items: updatedItems });
      }
      return updatedClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await clientService.deleteClient(id);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    data,
    getClients,
    createClient,
    updateClient,
    deleteClient
  };
};

export default useClient;