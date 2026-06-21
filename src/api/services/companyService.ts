import apiClient, { FILE_BASE_URL } from "../client";
import type {
  CommonInfo,
  CompaneAccountDetails,
  Company,
  SubscriptionStatistic,
} from "../types/company";
import type { PaginatedResponse } from "../types/common";

export interface GetAllCompaniesParams {
  partners: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

class CompanyService {
  async getCompany(): Promise<Company> {
    const response = await apiClient.get<Company>("/Company");
    return response.data;
  }

  async getCompanyById(id: number): Promise<Company> {
    const response = await apiClient.get<Company>(`/Company/${id}`);
    return response.data;
  }

  async getCommonInfo(): Promise<CommonInfo> {
    const response = await apiClient.get<CommonInfo>(`/Company/common-info`);
    return response.data;
  }

  async getAccountDetails(): Promise<CompaneAccountDetails> {
    const response = await apiClient.get<CompaneAccountDetails>(
      `/Company/account-details`
    );
    return response.data;
  }

  async getSubscriptionStatistics(
    id: number
  ): Promise<SubscriptionStatistic[]> {
    const response = await apiClient.get<SubscriptionStatistic[]>(
      `/Company/subscription/statistics/${id}`
    );
    return response.data;
  }

  async getFilledSender(scheduleId: number): Promise<string> {
    const response = await apiClient.get<ArrayBuffer>(
      `/SenderSettings/filled/${scheduleId}`,
      {
        responseType: "arraybuffer",
      }
    );
    const text = new TextDecoder("utf-8").decode(response.data);
    if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  }

  // GET /Company/all — серверная пагинация и поиск.
  // Бэкенд отдаёт PagedResult { page, pageSize, totalCount, totalPages, items }.
  async getAllCompanies(
    params: GetAllCompaniesParams
  ): Promise<PaginatedResponse<Company>> {
    const { partners, page = 1, pageSize = 10, search } = params;
    const response = await apiClient.get<PaginatedResponse<Company>>(
      "/Company/all",
      {
        params: {
          partners,
          page,
          pageSize,
          search: search?.trim() || undefined,
        },
      }
    );
    return response.data;
  }

  async updateCompany(company: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>("/Company", company);
    return response.data;
  }

  async updateCompanyById(
    id: number,
    company: Partial<Company>
  ): Promise<Company> {
    const response = await apiClient.put<Company>(`/Company/${id}`, company);
    return response.data;
  }

  async deleteCompany(id: number): Promise<void> {
    await apiClient.delete(`/Company/${id}`);
  }

  async updateCompanyPhoto(photo: File): Promise<Company> {
    const formData = new FormData();
    formData.append("photo", photo);

    const response = await apiClient.patch<Company>(
      "/Company/photo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async payoutPartner(partnerId: number, amount: number): Promise<void> {
    const response = await apiClient.patch<Company>(
      "/Company/partner/payout",
      null,
      {
        params: {
          partnerId,
          amount,
        },
      }
    );
  }

  async deleteCompanyPhoto(): Promise<void> {
    await apiClient.delete("/Company/photo");
  }

  getCompanyPhotoUrl(photoPath?: string): string | null {
    if (!photoPath) return null;
    return `${FILE_BASE_URL}${photoPath}`;
  }

  async createCompany(companyData: {
    AdminPhone: string;
    LicenceDate: Date;
    AdminName: string;
    CompanyName: string;
    IsPartner: boolean;
  }): Promise<Company> {
    const response = await apiClient.post<Company>("/Company", companyData);
    return response.data;
  }

  async addSubscription(
    id: number,
    request: AddSubscriptionRequest
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/Company/licence-date/${id}`, request, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to add subscription:", error);
      return false;
    }
  }

  async changePhone(id: number, phone: string): Promise<boolean> {
    try {
      await apiClient.patch(`/Company/phone/${id}`, `"${phone}"`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export interface AddSubscriptionRequest {
  cost: number;
  days: number;
  paymentType: number;
}

const PaymentType = {
  ACQUIRING: 0,
  CASH: 1,
  FREE: 2,
} as const;

export type PaymentTypeValue = (typeof PaymentType)[keyof typeof PaymentType];

export default new CompanyService();
