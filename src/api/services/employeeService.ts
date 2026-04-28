import apiClient from '../client';
import socialApiClient from '../socialApiClient';
import type { AuthSession } from '../types/auth';
import type { ClientExistsResponse } from '../types/client';
import type { PaginatedResponse } from '../types/common';
import type { AuthInfoResponse, CreditStats, Employee, EmployeeFilterRequest, EmployeeFullnames, PaymentStatsResponse, Profile, ProfileUpdateRequest } from '../types/employee';

class EmployeeService {
  static async getAuthInfo(): Promise<AuthInfoResponse> {
    try {
      const response = await apiClient.get('/Auth/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getEmployees(filter: EmployeeFilterRequest): Promise<PaginatedResponse<Employee>> {
    try {
      const response = await apiClient.get('/Employee', { params: filter });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  static async createEmployee(employeeData: {
    fullName: string;
    phone: string;
    address?: string;
    minSurcharge?: number;
    role?: string;
  }): Promise<Employee> {
    try {
      const formData = new FormData();
      formData.append('FullName', employeeData.fullName);
      formData.append('Phone', employeeData.phone);
      if (employeeData.address) {
        formData.append('Address', employeeData.address);
      }
      if (employeeData.minSurcharge !== undefined) {
        formData.append('MinSurcharge', employeeData.minSurcharge.toString());
      }
      if (employeeData.role) {
        formData.append('Role', employeeData.role);
      }

      const response = await apiClient.post('/Employee', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployee(employeeData: {
    id: number;
    fullName: string;
    address?: string;
  }): Promise<Employee> {
    try {
      const formData = new FormData();
      formData.append('Id', employeeData.id.toString());
      formData.append('FullName', employeeData.fullName);
      if (employeeData.address) {
        formData.append('Address', employeeData.address);
      }

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

  static async getEmployeeById(id: number): Promise<Employee> {
    try {
      const response = await apiClient.get(`/Employee/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getEmployeeCreditsStats(id: number, months: number = 12): Promise<CreditStats[]> {
    try {
      const response = await apiClient.get(`/Employee/credits-stats${id}?months=${months}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getEmployeePaymentsStats(id: number, months: number = 12): Promise<PaymentStatsResponse[]> {
    try {
      const response = await apiClient.get(`/Employee/payments-stats${id}?months=${months}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  static async getEmployeeFullnames(): Promise<EmployeeFullnames[]> {
    try {
      const response = await apiClient.get(`/Employee/fullnames`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteEmployee(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Employee/${id}`);
    } catch (error) {
      throw error;
    }
  }

  static async toggleEmployeeBlock(id: number): Promise<void> {
    try {
      await apiClient.patch(`/Employee/toggle-block/${id}`);
    } catch (error) {
      throw error;
    }
  }

  static async checkEmployeeExists(phone: string): Promise<boolean> {
    const response = await apiClient.get<ClientExistsResponse>('/Employee/exists', { 
      params: { phone } 
    });
    return response.data.exists;
  }

  static async deletePhoto() {
    await apiClient.delete('/Employee/photo');
    return;
  }

  static async updateEmployeePhone(id: number, phone: string): Promise<Employee> {
    try {
      const response = await apiClient.patch(`/Employee/phone/${id}`, phone, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployeeFullname(id: number, fullName: string): Promise<Employee> {
    try {
      const response = await apiClient.patch(`Employee/director/fullname/${id}`, fullName, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployeeMinSurcharge(id: number, minSurcharge: number): Promise<Employee> {
    try {
      const response = await apiClient.patch(`/Employee/min-surcharge/${id}`, minSurcharge, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async togglePermission(employeeId: number, permissionCode: string): Promise<Employee> {
    try {
      const response = await apiClient.put('/Permission/toggle', {
        employeeId,
        permissionCode
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateSelfRole(role: string): Promise<Employee> {
    try {
      const response = await apiClient.patch(`/Employee/role`, role, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateEmployeeRole(id: number, role: string): Promise<Employee> {
    try {
      const response = await apiClient.patch(`/Employee/role/${id}`, role, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getProfile(id?: number): Promise<Profile> {
    try {
      const url = id ? `/Profile?id=${id}` : '/Profile';
      const response = await socialApiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(request: ProfileUpdateRequest): Promise<void> {
    try {
      const formData = new FormData();
      if (request.id) {
        formData.append('Id', request.id.toString());
      }
      formData.append('Description', request.description);

      await socialApiClient.put('/Profile/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  static async getSessions(): Promise<AuthSession[]> {
    try {
      const response = await apiClient.get('/Auth/sessions');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async revokeSession(tokenId?: number): Promise<void> {
    try {
      await apiClient.post('/Auth/session/revoke', { tokenId: tokenId ?? null });
    } catch (error) {
      throw error;
    }
  }

  static async revokeAllSessions(): Promise<void> {
    try {
      await apiClient.post('/Auth/revoke-all-sessions');
    } catch (error) {
      throw error;
    }
  }

  static async setSelfCompany(companyId: number): Promise<void> {
    try {
      await apiClient.put(`/Employee/enter-company/${companyId}`);
    } catch (error) {
      throw error;
    }
  }
}

export default EmployeeService;