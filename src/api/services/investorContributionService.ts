import apiClient from '../client';
import type { PaginatedResponse, PaginationParams } from '../types/common';
import type { InvestorContribution } from '../types/investorContribution';

class InvestorContributionService {
  async getInvestorContributions(investorId?: number, poolId?: number, params?: PaginationParams): Promise<PaginatedResponse<InvestorContribution>> {
      const response = await apiClient.get<PaginatedResponse<InvestorContribution>>(`/InvestmentContribution/`, {
          params: {
              ...params,
              ...(investorId && { investorId }),
              ...(poolId && { poolId })
          }
      });
      return response.data;
  }

  async makeAction(id: number, action: string) {
    await apiClient.patch(`/InvestmentContribution/action/${id}`, action);
    return;
  }
}

export default new InvestorContributionService();