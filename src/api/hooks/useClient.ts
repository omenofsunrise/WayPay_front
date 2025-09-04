import { useState, useCallback } from 'react';
import type { Client, ClientParams, PassportPhotoResponse } from '../types/client';
import type { PaginatedResponse } from '../types/common';
import clientService from '../services/clientService';

const useClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<PassportPhotoResponse | null>(null);

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
      return false;
    }
  }

  // Новые методы для работы с фотографиями паспорта
  const uploadPassportPhoto = async (id: number, file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clientService.uploadPassportPhoto(id, file);
      // После загрузки обновляем информацию о фото
      await getPassportPhoto(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPassportPhoto = async (id: number): Promise<PassportPhotoResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientService.getPassportPhoto(id);
      setPassportPhoto(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePassportPhoto = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clientService.deletePassportPhoto(id);
      setPassportPhoto(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
    
  return {
    isLoading,
    error,
    data,
    currentClient,
    passportPhoto,
    getClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    updateClientDoc,
    updateClientDocIssueDate,
    checkClientExists,
    checkClientCredits,
    uploadPassportPhoto,
    getPassportPhoto,
    deletePassportPhoto
  };
};

export default useClient;