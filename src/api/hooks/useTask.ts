// hooks/useTask.ts
import { useState, useCallback } from 'react';
import taskService from '../services/taskService';
import type { Task, TaskParams, TaskForm } from '../types/task';
import type { PaginatedResponse } from '../types/common';

const useTask = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Task> | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const getTasks = useCallback(async (params?: TaskParams): Promise<PaginatedResponse<Task> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.getTasks(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = async (task: TaskForm): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdTask = await taskService.createTask(task);
      return createdTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setTaskPending = async (id: number): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.setTaskPending(id);
      updateTaskInList(updatedTask);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setTaskInProgress = async (id: number): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.setTaskInProgress(id);
      updateTaskInList(updatedTask);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setTaskInReview = async (id: number): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.setTaskInReview(id);
      updateTaskInList(updatedTask);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setTaskDone = async (id: number): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.setTaskDone(id);
      updateTaskInList(updatedTask);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await taskService.deleteTask(id);
      if (data) {
        const filteredItems = data.items.filter(item => item.id !== id);
        setData({ ...data, items: filteredItems });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskInList = (updatedTask: Task) => {
    if (data) {
      const updatedItems = data.items.map(item => 
        item.id === updatedTask.id ? updatedTask : item
      );
      setData({ ...data, items: updatedItems });
    }
  };

  return {
    isLoading,
    error,
    data,
    currentTask,
    getTasks,
    createTask,
    setTaskPending,
    setTaskInProgress,
    setTaskInReview,
    setTaskDone,
    deleteTask,
  };
};

export default useTask;