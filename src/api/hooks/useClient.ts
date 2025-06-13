import { useState, useCallback } from 'react';
import clientService from '../services/clientService';
import type { Client, ClientParams } from '../types/client';
import type { PaginatedResponse } from '../types/common';

const useClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

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

  const getClientById = useCallback(async (id: number): Promise<Client | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientService.getClientById(id);
      setCurrentClient(result);
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

  const updateClientDoc = async (id: number, doc: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clientService.updateClientDoc(id, doc);
      if (currentClient && currentClient.id === id) {
        setCurrentClient({ ...currentClient, doc });
      }
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, doc } : item
        );
        setData({ ...data, items: updatedItems });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClientDocIssueDate = async (id: number, docIssueDate: Date): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clientService.updateClientDocIssueDate(id, docIssueDate);
      if (currentClient && currentClient.id === id) {
        setCurrentClient({ ...currentClient, docIssueDate });
      }
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, docIssueDate } : item
        );
        setData({ ...data, items: updatedItems });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  const checkClientExists = useCallback(async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const exists = await clientService.checkClientExists(phone);
      return exists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkClientCredits = async (id: number): Promise<boolean> => {
    try {
      const result = await clientService.CheckClientCredits(id);
      return result;
    }
    catch (err) {
    }
    finally {
    }
  }
    
  return {
    isLoading,
    error,
    data,
    currentClient,
    getClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    updateClientDoc,
    updateClientDocIssueDate,
    checkClientExists,
    checkClientCredits
  };
};

export default useClient;