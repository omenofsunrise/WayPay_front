import { useState, useEffect, useCallback } from 'react';
import { EmployeeService } from '../services/employeeService';
import type { AuthInfoResponse, Employee } from '../types/employee';
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

  const updateEmployee = useCallback(async (employeeData: {
    id: number;
    fullName: string;
    address?: string;
    phone: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEmployee = await EmployeeService.updateEmployee(employeeData);
      setAuthInfo(prev => prev ? {
        ...prev,
        employee: {
          ...prev.employee,
          ...updatedEmployee,
          fullName: updatedEmployee.fullName,
        }
      } : null);
      return updatedEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmployeePhoto = useCallback(async (id: number, photoFile: File) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEmployee = await EmployeeService.updateEmployeePhoto(id, photoFile);
      setAuthInfo(prev => prev ? {
        ...prev,
        employee: {
          ...prev.employee,
          ...updatedEmployee,
          photoPath: updatedEmployee.photoPath,
        }
      } : null);
      return updatedEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
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
    refresh: fetchAuthInfo,
    updateEmployee,
    updateEmployeePhoto,
  };
}