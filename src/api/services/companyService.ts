import apiClient from '../client';
import type { Company } from '../types/company';

class CompanyService {
  async getCompany(): Promise<Company> {
    const response = await apiClient.get<Company>('/api/Company');
    return response.data;
  }

  async updateCompany(company: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>('/api/Company', company);
    return response.data;
  }
}

export default new CompanyService();