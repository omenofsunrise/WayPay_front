import { useState, useCallback } from 'react';
import {
  PassportPhotoType,
  type Client,
  type ClientContact,
  type ClientParams,
  type ContactType,
  type PassportPhotoResponse,
} from '../types/client';
import type { PaginatedResponse } from '../types/common';
import clientService from '../services/clientService';

const useClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<PassportPhotoResponse | null>(null);
  const [passportPhotos, setPassportPhotos] = useState<{
  mainPage: PassportPhotoResponse | null;
  registrationPage: PassportPhotoResponse | null;
  }>({
    mainPage: null,
    registrationPage: null
  });

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

  const uploadPassportPhoto = async (id: number, file: File, photoType: PassportPhotoType): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientService.uploadPassportPhoto(id, file, photoType);
      if (!result.success) {
        throw new Error(result.message);
      }
      await getPassportPhoto(id, photoType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPassportPhoto = async (id: number, photoType: PassportPhotoType): Promise<PassportPhotoResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await clientService.getPassportPhoto(id, photoType);
      
      setPassportPhotos(prev => ({
        ...prev,
        [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: result
      }));
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllPassportPhotos = async (id: number): Promise<void> => {
    try {
      await Promise.all([
        getPassportPhoto(id, PassportPhotoType.MainPage),
        getPassportPhoto(id, PassportPhotoType.RegistrationPage)
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const extractApiError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: unknown } }).response;
      const data = response?.data;
      if (typeof data === 'string' && data) return data;
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (typeof obj.message === 'string') return obj.message;
        if (typeof obj.title === 'string') return obj.title;
        if (typeof obj.error === 'string') return obj.error;
      }
    }
    return err instanceof Error ? err.message : 'Unknown error';
  };

  const createContact = useCallback(async (
    clientId: number,
    type: ContactType,
    value: string,
  ): Promise<{ ok: boolean; data: ClientContact | null; error: string | null }> => {
    setError(null);
    try {
      const created = await clientService.createContact({ clientId, type, value });
      return { ok: true, data: created, error: null };
    } catch (err) {
      console.error('createContact failed:', err);
      const message = extractApiError(err);
      setError(message);
      return { ok: false, data: null, error: message };
    }
  }, []);

  const updateContact = useCallback(async (
    contactId: number,
    value: string,
  ): Promise<{ ok: boolean; data: ClientContact | null; error: string | null }> => {
    setError(null);
    try {
      const updated = await clientService.updateContact({ contactId, value });
      return { ok: true, data: updated, error: null };
    } catch (err) {
      console.error('updateContact failed:', err);
      const message = extractApiError(err);
      setError(message);
      return { ok: false, data: null, error: message };
    }
  }, []);

  const deleteContact = useCallback(async (contactId: number): Promise<{ ok: boolean; error: string | null }> => {
    setError(null);
    try {
      await clientService.deleteContact(contactId);
      return { ok: true, error: null };
    } catch (err) {
      console.error('deleteContact failed:', err);
      const message = extractApiError(err);
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const getClientContacts = useCallback(async (id: number): Promise<ClientContact[] | null> => {
    try {
      const client = await clientService.getClientById(id);
      return client.contacts || [];
    } catch (err) {
      console.error('getClientContacts failed:', err);
      return null;
    }
  }, []);

  const deletePassportPhoto = async (id: number, photoType: PassportPhotoType): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clientService.deletePassportPhoto(id, photoType);
      
      setPassportPhotos(prev => ({
        ...prev,
        [photoType === PassportPhotoType.MainPage ? 'mainPage' : 'registrationPage']: null
      }));
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
    passportPhotos,
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
    deletePassportPhoto,
    getAllPassportPhotos,
    createContact,
    updateContact,
    deleteContact,
    getClientContacts,
  };
};

export default useClient;