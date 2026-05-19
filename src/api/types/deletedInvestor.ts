export interface DeletedInvestorRef {
  id: number;
  nickname: string;
  fullName: string;
}

export interface DeletedInvestorPayout {
  id: number;
  investorId: number;
  employeeId: number;
  amount: number;
  payoutDate: string;
  payoutSource: string;
  confirmed: boolean;
  investor: DeletedInvestorRef;
  employee?: {
    id: number;
    fullName: string;
  } | null;
}

export interface DeletedInvestorContribution {
  id: number;
  amount: number;
  createdAt: string;
  date: string;
  investorId: number;
  confirmed: boolean;
  investor: DeletedInvestorRef;
}

export interface DeletedInvestorInfo {
  payouts: DeletedInvestorPayout[];
  contributions: DeletedInvestorContribution[];
}
