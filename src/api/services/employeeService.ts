import apiClient from '../client';
import type { AuthInfoResponse } from '../types/employee';

export class EmployeeService {
  static async getAuthInfo(): Promise<AuthInfoResponse> {
    try {
      const response = await apiClient.get('/Auth/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}