import { useState, useEffect, useCallback } from 'react';
import { EmployeeService } from '../services/employeeService';
import type { AuthInfoResponse } from '../types/employee';
import { authStorage } from '../utils/auth-storage';

export function useEmployee() {
  const [authInfo, setAuthInfo] = useState<AuthInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthInfo = useCallback(async () => {
    if (!authStorage.getAccessToken()) {
      setError('No access token available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeService.getAuthInfo();
      setAuthInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthInfo();
  }, [fetchAuthInfo]);

  return {
    authInfo,
    loading,
    error,
    refresh: fetchAuthInfo
  };
}