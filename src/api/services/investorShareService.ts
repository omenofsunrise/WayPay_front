import apiClient from "../client";
import publicClient from "../publicClient";
import type {
  InvestorShareTokenResponse,
  InvestorSharedReportResponse,
} from "../types/investorShare";

// Бэкенд может отдать ответ как text/plain, тогда axios вернёт строку.
const asObject = <T>(data: unknown): T =>
  typeof data === "string" ? (JSON.parse(data) as T) : (data as T);

class InvestorShareService {
  // Ссылку выписывает сотрудник, поэтому запрос идёт с его токеном.
  async createShareLink(
    investorId: number,
    hours?: number
  ): Promise<InvestorShareTokenResponse> {
    const response = await apiClient.post("/Investor/report/temporary-token", {
      investorId,
      hours,
    });
    return asObject<InvestorShareTokenResponse>(response.data);
  }

  // Инвестор открывает ссылку без входа в систему — без интерсепторов.
  async getSharedReport(token: string): Promise<InvestorSharedReportResponse> {
    const response = await publicClient.get(
      "/Investor/report/by/temporary-token",
      { params: { token } }
    );
    return asObject<InvestorSharedReportResponse>(response.data);
  }
}

export default new InvestorShareService();
