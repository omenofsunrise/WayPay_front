import apiClient from '../client';
import type { Company } from '../types/company';

class CompanyService {
  async getCompany(): Promise<Company> {
    const response = await apiClient.get<Company>('/Company');
    return response.data;
  }

  async getCompanyById(id: number): Promise<Company> {
    const response = await apiClient.get<Company>(`/Company/${id}`);
    return response.data;
  }

  async getAllCompanies(): Promise<Company[]> {
    const response = await apiClient.get<Company[]>('/Company/all');
    return response.data;
  }

  async updateCompany(company: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>('/Company', company);
    return response.data;
  }

  async updateCompanyById(id: number, company: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>(`/Company/${id}`, company);
    return response.data;
  }

  async deleteCompany(id: number): Promise<void> {
    await apiClient.delete(`/Company/${id}`);
  }

  async createCompany(companyData: {
    AdminPhone: string;
    LicenceDate: Date;
  }): Promise<Company> {
    const response = await apiClient.post<Company>('/Company', companyData);
    return response.data;
  }

  async changeLicenceDate(id: number, licenceDate: Date): Promise<boolean> {
    try {
      // Обрезаем время, оставляем только дату (например, "2026-06-27")
      const dateOnlyStr = licenceDate.toISOString().split('T')[0];
      await apiClient.patch(`/Company/licence-date/${id}`, dateOnlyStr, {
        headers: {
          'Content-Type': 'application/json', // Важно!
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async changePhone(id: number, phone: string): Promise<boolean> {
    try {
      await apiClient.patch(
        `/Company/phone/${id}`,
        `"${phone}"`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }
}

export default new CompanyService();