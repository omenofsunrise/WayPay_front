import { useState, useCallback } from 'react';
import queueService from '../services/queueService';
import type { Queue, QueueParams } from '../types/queue';
import type { PaginatedResponse } from '../types/common';

const useQueue = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Queue> | null>(null);

  const getQueues = useCallback(async (params?: QueueParams): Promise<PaginatedResponse<Queue> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queueService.getQueues(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createQueue = async (queue: Omit<Queue, 'id'>): Promise<Queue | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdQueue = await queueService.createQueue(queue);
      return createdQueue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    getQueues,
    createQueue,
  };
};

export default useQueue;