import apiClient from '../client';
import type {
  BudgetIncome,
  BudgetOutcome,
  CreateBudgetIncomeDto,
  CreateBudgetOutcomeDto,
  BudgetParams,
  BudgetIncomeResponse,
  BudgetOutcomeResponse
} from '../types/budget';

export const BudgetService = {
  // Income endpoints
  getIncomes: async (params: BudgetParams): Promise<BudgetIncomeResponse> => {
    const response = await apiClient.get<BudgetIncomeResponse>('/BudgetIncome', { params });
    return response.data;
  },

  createIncome: async (data: CreateBudgetIncomeDto): Promise<BudgetIncome> => {
    const response = await apiClient.post<BudgetIncome>('/BudgetIncome', data);
    return response.data;
  },

  deleteIncome: async (id: number): Promise<void> => {
    await apiClient.delete(`/BudgetIncome/${id}`);
  },

  // Outcome endpoints
  getOutcomes: async (params: BudgetParams): Promise<BudgetOutcomeResponse> => {
    const response = await apiClient.get<BudgetOutcomeResponse>('/BudgetOutcome', { params });
    return response.data;
  },

  createOutcome: async (data: CreateBudgetOutcomeDto): Promise<BudgetOutcome> => {
    const response = await apiClient.post<BudgetOutcome>('/BudgetOutcome', data);
    return response.data;
  },

  deleteOutcome: async (id: number): Promise<void> => {
    await apiClient.delete(`/BudgetOutcome/${id}`);
  }
};