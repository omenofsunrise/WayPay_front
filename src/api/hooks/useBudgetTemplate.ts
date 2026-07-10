import { useState, useCallback } from "react";
import type {
  BudgetTemplate,
  BudgetTemplateParams,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
} from "../types/budgetTemplate";
import { BudgetTemplateService } from "../services/budgetTemplateService";

const useBudgetTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);

  const getTemplates = useCallback(
    async (params?: BudgetTemplateParams): Promise<BudgetTemplate[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await BudgetTemplateService.getTemplates(params);
        setTemplates(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createTemplate = async (
    data: CreateBudgetTemplateDto
  ): Promise<BudgetTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await BudgetTemplateService.createTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (
    id: number,
    data: UpdateBudgetTemplateDto
  ): Promise<BudgetTemplate | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await BudgetTemplateService.updateTemplate(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await BudgetTemplateService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const setTemplateActive = async (
    id: number,
    isActive: boolean
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (isActive) {
        await BudgetTemplateService.activateTemplate(id);
      } else {
        await BudgetTemplateService.deactivateTemplate(id);
      }
      setTemplates((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    templates,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setTemplateActive,
  };
};

export default useBudgetTemplate;
