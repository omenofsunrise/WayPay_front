import { useState, useCallback } from 'react';
import type { BudgetOutcome, CreateBudgetOutcomeDto, BudgetParams, BudgetOutcomeResponse } from '../types/budget';
import { BudgetService } from '../services/budgetService';

const useBudgetOutcome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<BudgetOutcomeResponse | null>(null);

  const getOutcomes = useCallback(async (params: BudgetParams): Promise<BudgetOutcomeResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await BudgetService.getOutcomes(params);
      setOutcomes(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOutcome = async (outcomeData: CreateBudgetOutcomeDto): Promise<BudgetOutcome | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdOutcome = await BudgetService.createOutcome(outcomeData);
      return createdOutcome;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOutcome = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await BudgetService.deleteOutcome(id);
      if (outcomes) {
        const filteredItems = outcomes.items.filter(item => item.id !== id);
        setOutcomes({
          ...outcomes,
          items: filteredItems,
          totalCount: outcomes.totalCount - 1,
          totalOutcomeAmount: outcomes.totalOutcomeAmount - (outcomes.items.find(item => item.id === id)?.amount || 0)
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
    outcomes,
    getOutcomes,
    createOutcome,
    deleteOutcome
  };
};

export default useBudgetOutcome;