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

// Ответ GET /api/Investor/report/by/temporary-token
export interface InvestorSharedReportResponse {
  expiresAt: string;
  report: InvestorReport;
  credits: InvestorSharedCredit[];
}
