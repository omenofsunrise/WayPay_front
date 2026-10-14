import { useState, useCallback } from 'react';
import type {
  BudgetIncome,
  CreateBudgetIncomeDto,
  BudgetParams,
  BudgetIncomeResponse
} from '../types/budget';
import { BudgetService } from '../services/budgetService';

const useBudgetIncome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomes, setIncomes] = useState<BudgetIncomeResponse | null>(null);

  const getIncomes = useCallback(
    async (params: BudgetParams): Promise<BudgetIncomeResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await BudgetService.getIncomes(params);
        setIncomes(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createIncome = async (
    incomeData: CreateBudgetIncomeDto
  ): Promise<BudgetIncome | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdIncome = await BudgetService.createIncome(incomeData);
      return createdIncome;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIncome = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await BudgetService.deleteIncome(id);
      if (incomes) {
        const filteredItems = incomes.items.filter(item => item.id !== id);
        setIncomes({
          ...incomes,
          items: filteredItems,
          totalCount: incomes.totalCount - 1,
          totalIncomeAmount:
            incomes.totalIncomeAmount -
            (incomes.items.find(item => item.id === id)?.amount || 0)
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    incomes,
    getIncomes,
    createIncome,
    deleteIncome
  };
};

export default useBudgetIncome;