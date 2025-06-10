import apiClient from '../client';
import type { AuthInfoResponse, CreditStats, Employee, PaymentStatsResponse } from '../types/employee';

export class EmployeeService {
  static async getAuthInfo(): Promise<AuthInfoResponse> {
    try {
      const response = await apiClient.get('/Auth/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployee(employeeData: {
    id: number;
    fullName: string;
    address?: string;
    phone: string;
  }): Promise<Employee> {
    try {
      const formData = new FormData();
      formData.append('Id', employeeData.id.toString());
      formData.append('FullName', employeeData.fullName);
      if (employeeData.address) {
        formData.append('Address', employeeData.address);
      }
      formData.append('Phone', employeeData.phone);

      const response = await apiClient.put('/Employee', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployeePhoto(id: number, photoFile: File): Promise<Employee> {
    try {
      const formData = new FormData();
      formData.append('Id', id.toString());
      formData.append('Photo', photoFile);

      const response = await apiClient.put('/Employee/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getCreditsStats(months: number = 12): Promise<CreditStats[]> {
    try {
      const response = await apiClient.get(`/Employee/credits-stats?months=${months}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getPaymentsStats(months: number = 12): Promise<PaymentStatsResponse[]> {
    try {
      const response = await apiClient.get(`/Employee/payments-stats?months=${months}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}