import type { InvestorReport, InvestorReportCellField } from "../api/types/investor";

export const getInvestorReportDisplayValues = (
  report: InvestorReport,
): Pick<InvestorReport, InvestorReportCellField> => {
  const overrides = report.cellOverrides;
  return {
    investment: overrides?.investment ?? report.investment,
    balance: overrides?.balance ?? report.balance,
    paymentIncome: overrides?.paymentIncome ?? report.paymentIncome,
    investorPaymentIncome: overrides?.investorPaymentIncome ?? report.investorPaymentIncome,
    selfPaymentIncome: overrides?.selfPaymentIncome ?? report.selfPaymentIncome,
  };
};
