export interface InvestorPayout {
  id: number;
  employeeFullName: string;
  amount: number;
  payoutDate: string;
}

export interface CreateInvestorPayoutDto {
  investorId: number;
  amount: number;
}