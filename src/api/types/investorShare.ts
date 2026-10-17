import type { InvestorReport } from "./investor";

// Ответ POST /api/Investor/report/temporary-token
export interface InvestorShareTokenResponse {
  investorId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

// Договор, в котором лежат деньги инвестора.
export interface InvestorSharedCredit {
  id: number;
  name?: string | null;
  clientFullName?: string | null;
  creditDate: string;
  termMonths: number;
  isActive: boolean;
  totalAmount: number;
  payed: number;
  rest: number;
}

// Страница договоров: у инвестора их может быть тысяча.
export interface InvestorSharedCreditsPage {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: InvestorSharedCredit[];
}

// Ответ GET /api/Investor/report/by/temporary-token
export interface InvestorSharedReportResponse {
  expiresAt: string;
  report: InvestorReport;
  credits: InvestorSharedCreditsPage;
}
