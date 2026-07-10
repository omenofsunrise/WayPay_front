import apiClient from "../client";
import type {
  BudgetTemplate,
  BudgetTemplateParams,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
} from "../types/budgetTemplate";

export const BudgetTemplateService = {
  getTemplates: async (
    params?: BudgetTemplateParams
  ): Promise<BudgetTemplate[]> => {
    const response = await apiClient.get<
      BudgetTemplate[] | { items: BudgetTemplate[] }
    >("/BudgetTemplates", { params });
    const data = response.data as any;
    // Эндпоинт отдаёт массив; на случай пагинированной обёртки достаём items.
    return Array.isArray(data) ? data : data?.items ?? [];
  },

  getTemplate: async (id: number): Promise<BudgetTemplate> => {
    const response = await apiClient.get<BudgetTemplate>(
      `/BudgetTemplates/${id}`
    );
    return response.data;
  },

  createTemplate: async (
    data: CreateBudgetTemplateDto
  ): Promise<BudgetTemplate> => {
    const response = await apiClient.post<BudgetTemplate>(
      "/BudgetTemplates",
      data
    );
    return response.data;
  },

  updateTemplate: async (
    id: number,
    data: UpdateBudgetTemplateDto
  ): Promise<BudgetTemplate> => {
    const response = await apiClient.put<BudgetTemplate>(
      `/BudgetTemplates/${id}`,
      data
    );
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`/BudgetTemplates/${id}`);
  },

  activateTemplate: async (id: number): Promise<void> => {
    await apiClient.patch(`/BudgetTemplates/${id}/activate`);
  },

  deactivateTemplate: async (id: number): Promise<void> => {
    await apiClient.patch(`/BudgetTemplates/${id}/deactivate`);
  },
};
