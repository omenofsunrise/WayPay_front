import { useState, useCallback } from 'react';
import type { 
  BranchWithCoordinatesResponse, 
  CreateBranchRequest,
  UpdateBranchRequest 
} from '../types/branch';
import branchService from '../services/branchService';

const useBranch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myBranches, setMyBranches] = useState<BranchWithCoordinatesResponse[]>([]);
  const [currentBranch, setCurrentBranch] = useState<BranchWithCoordinatesResponse | null>(null);

  const getMyBranches = useCallback(async (): Promise<BranchWithCoordinatesResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await branchService.getMyBranches();
      setMyBranches(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBranch = async (branchData: CreateBranchRequest): Promise<BranchWithCoordinatesResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdBranch = await branchService.createBranch(branchData);
      setMyBranches(prev => [...prev, createdBranch]);
      return createdBranch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBranch = async (id: number, branchData: UpdateBranchRequest): Promise<BranchWithCoordinatesResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedBranch = await branchService.updateBranch(id, branchData);
      
      setMyBranches(prev => 
        prev.map(branch => branch.id === id ? updatedBranch : branch)
      );
      
      if (currentBranch && currentBranch.id === id) {
        setCurrentBranch(updatedBranch);
      }
      
      return updatedBranch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBranch = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await branchService.deleteBranch(id);
      
      setMyBranches(prev => prev.filter(branch => branch.id !== id));
      
      if (currentBranch && currentBranch.id === id) {
        setCurrentBranch(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    myBranches,
    currentBranch,
    
    getMyBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    clearError,
    
    setCurrentBranch
  };
};

export default useBranch;