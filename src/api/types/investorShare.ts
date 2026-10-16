import type { InvestorReport } from "./investor";

// Ответ POST /api/Investor/report/temporary-token
export interface InvestorShareTokenResponse {
  investorId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

// Ответ GET /api/Investor/report/by/temporary-token
export interface InvestorSharedReportResponse {
  expiresAt: string;
  report: InvestorReport;
}
