import { useState, useEffect, useCallback } from 'react';
import EmployeeService from '../services/employeeService';
import type { AuthInfoResponse, CreditStats, Employee, EmployeeFilterRequest, PaymentStatsResponse } from '../types/employee';
import { authStorage } from '../utils/auth-storage';
import type { PaginatedResponse } from '../types/common';

export function useEmployee() {
  const [authInfo, setAuthInfo] = useState<AuthInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsStats, setCreditsStats] = useState<CreditStats[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [paymentsStats, setPaymentsStats] = useState<PaymentStatsResponse[]>([]);
  const [paymentsStatsLoading, setPaymentsStatsLoading] = useState<boolean>(false);
  const [paymentsStatsError, setPaymentsStatsError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<PaginatedResponse<Employee> | null>(null);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  
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

  const fetchEmployees = useCallback(async (filter: EmployeeFilterRequest) => {
    try {
      setEmployeesLoading(true);
      setEmployeesError(null);
      const data = await EmployeeService.getEmployees(filter);
      setEmployees(data);
      return data;
    } catch (err) {
      setEmployeesError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchCreditsStats = useCallback(async (months: number = 12) => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const stats = await EmployeeService.getCreditsStats(months);
      setCreditsStats(stats);
      return stats;
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPaymentsStats = useCallback(async (months: number = 12) => {
    try {
      setPaymentsStatsLoading(true);
      setPaymentsStatsError(null);
      const stats = await EmployeeService.getPaymentsStats(months);
      setPaymentsStats(stats);
      return stats;
    } catch (err) {
      setPaymentsStatsError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setPaymentsStatsLoading(false);
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
    creditsStats,
    paymentsStats,
    statsLoading,
    paymentsStatsLoading,
    statsError,
    paymentsStatsError, 
    refresh: fetchAuthInfo,
    updateEmployee,
    updateEmployeePhoto,
    fetchCreditsStats,
    fetchPaymentsStats, 
    employees,
    employeesLoading,
    employeesError,
    fetchEmployees,
  };
}