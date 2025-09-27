import apiClient from '../client';
import type { PaginatedResponse } from '../types/common';
import type { InvestorContribution } from '../types/investorContribution';

class InvestorContributionService {
  async getInvestorContributions(investorId: number): Promise<PaginatedResponse<InvestorContribution>> {
    const response = await apiClient.get<PaginatedResponse<InvestorContribution>>(`/InvestorContribution/investor/${investorId}`);
    return response.data;
  }
}

export default new InvestorContributionService();