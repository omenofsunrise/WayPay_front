export interface InvestorContribution {
  id: number;
  amount: number;
  date: Date;
  confirmed: boolean;
  investorNickname?: string;
}
