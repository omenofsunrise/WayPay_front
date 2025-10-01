import { useState, useCallback } from 'react';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { RegistrationApproveRequest, RegistrationFilesResponse, RegistrationRejectRequest, RegistrationResponse } from '../types/registrationRequest';
import registrationRequestService from '../services/registrationRequestService';

const useRegistrationRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<RegistrationResponse> | null>(null);

  const getRegistrationResponse = useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<RegistrationResponse> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await registrationRequestService.getRegistrationRequests(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFilesForRegistrationRequest = useCallback(async (id: number): Promise<RegistrationFilesResponse | null> => {
      try {
          const result = await registrationRequestService.getFilesForRegistrationRequest(id);
          return result;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          return null;
      } finally {
          setIsLoading(false);
      }
  }, []);

  const approveRegistrationRequest = useCallback(async (request: RegistrationApproveRequest) => {
    try {
          await registrationRequestService.approveRegistrationRequest(request);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
          setIsLoading(false);
      }
  }, []);

    const rejectRegistrationRequest = useCallback(async (request: RegistrationRejectRequest) => {
    try {
          await registrationRequestService.rejectRegistrationRequest(request);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
          setIsLoading(false);
      }
  }, []);

  return {
    isLoading,
    error,
    data,
    getRegistrationResponse,
    getFilesForRegistrationRequest,
    approveRegistrationRequest,
    rejectRegistrationRequest
  };
};

export default useRegistrationRequest;