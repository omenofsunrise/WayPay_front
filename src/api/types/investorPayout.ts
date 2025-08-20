export interface InvestorPayout {
  id: number;
  investorId: number;
  investorFullName: string;
  employeeFullName: string;
  amount: number;
  payoutDate: string;
}

export interface CreateInvestorPayoutDto {
  investorId: number;
  amount: number;
}