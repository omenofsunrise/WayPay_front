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
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState<boolean>(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [employeeCreditsStats, setEmployeeCreditsStats] = useState<CreditStats[]>([]);
  const [employeePaymentsStats, setEmployeePaymentsStats] = useState<PaymentStatsResponse[]>([]);
  const [employeeStatsLoading, setEmployeeStatsLoading] = useState<boolean>(false);
  const [employeeStatsError, setEmployeeStatsError] = useState<string | null>(null);

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
      return data;
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

  const fetchEmployeeById = useCallback(async (id: number) => {
    try {
      setEmployeeLoading(true);
      setEmployeeError(null);
      const data = await EmployeeService.getEmployeeById(id);
      setEmployee(data);
      return data;
    } catch (err) {
      setEmployeeError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const fetchEmployeeCreditsStats = useCallback(async (id: number, months: number = 12) => {
    try {
      setEmployeeStatsLoading(true);
      setEmployeeStatsError(null);
      const stats = await EmployeeService.getEmployeeCreditsStats(id, months);
      setEmployeeCreditsStats(stats);
      return stats;
    } catch (err) {
      setEmployeeStatsError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setEmployeeStatsLoading(false);
    }
  }, []);

  const fetchEmployeePaymentsStats = useCallback(async (id: number, months: number = 12) => {
    try {
      setEmployeeStatsLoading(true);
      setEmployeeStatsError(null);
      const stats = await EmployeeService.getEmployeePaymentsStats(id, months);
      setEmployeePaymentsStats(stats);
      return stats;
    } catch (err) {
      setEmployeeStatsError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setEmployeeStatsLoading(false);
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

  const createEmployee = useCallback(async (employeeData: {
    fullName: string;
    phone: string;
    address?: string;
    minSurcharge?: number;
    role?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const newEmployee = await EmployeeService.createEmployee(employeeData);
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await EmployeeService.deleteEmployee(id);
      if (employees) {
        await fetchEmployees({
          page: employees.page,
          pageSize: employees.pageSize,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employees, fetchEmployees]);

  const checkEmployeeExists = useCallback(async (phone: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const exists = await EmployeeService.checkEmployeeExists(phone);
        return exists;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      } finally {
        setLoading(false);
      }
    }, []);

    const deletePhoto = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        await EmployeeService.deletePhoto();
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return;
      } finally {
        setLoading(false);
      }
    }, []);

    const updateEmployeePhone = useCallback(async (id: number, phone: string) => {
      try {
        setLoading(true);
        setError(null);
        const updatedEmployee = await EmployeeService.updateEmployeePhone(id, phone);
        
        setEmployees(prev => prev ? {
          ...prev,
          items: prev.items.map(e => e.id === id ? updatedEmployee : e)
        } : null);
        
        setAuthInfo(prev => prev && prev.employee.id === id ? {
          ...prev,
          employee: {
            ...prev.employee,
            phone: updatedEmployee.phone
          }
        } : prev);
        
        return updatedEmployee;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    const updateEmployeeMinSurcharge = useCallback(async (id: number, minSurcharge: number) => {
      try {
        setLoading(true);
        setError(null);
        const updatedEmployee = await EmployeeService.updateEmployeeMinSurcharge(id, minSurcharge);
        
        setEmployees(prev => prev ? {
          ...prev,
          items: prev.items.map(e => e.id === id ? updatedEmployee : e)
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
    createEmployee, 
    updateEmployee,
    updateEmployeePhoto,
    fetchCreditsStats,
    fetchPaymentsStats, 
    employees,
    employeesLoading,
    employeesError,
    fetchEmployees,
    deleteEmployee,
    checkEmployeeExists,
    employee,
    employeeLoading,
    employeeError,
    employeeCreditsStats,
    employeePaymentsStats,
    employeeStatsLoading,
    employeeStatsError,
    fetchEmployeeById,
    fetchEmployeeCreditsStats,
    fetchEmployeePaymentsStats,
    deletePhoto,
    updateEmployeePhone,
    updateEmployeeMinSurcharge
  };
}