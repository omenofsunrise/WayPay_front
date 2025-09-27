import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { InvestorContribution } from '../types/investorContribution';

class InvestorContributionService {
  async getInvestorContributions(investorId: number, params?: PaginationParams): Promise<PaginatedResponse<InvestorContribution>> {
    const response = await apiClient.get<PaginatedResponse<InvestorContribution>>(`/InvestmentContribution/investor/${investorId}`, {params});
    return response.data;
  }
}

export default new InvestorContributionService();