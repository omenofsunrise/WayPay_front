import type { Task, TaskParams, TaskForm } from '../types/task';
import type { PaginatedResponse } from '../types/common';
import socialApiClient from '../socialApiClient';

class TaskService {
  async getTasks(params?: TaskParams): Promise<PaginatedResponse<Task>> {
    const response = await socialApiClient.get<PaginatedResponse<Task>>('/Task', { params });
    return response.data;
  }

  async createTask(task: TaskForm): Promise<Task> {
    const response = await socialApiClient.post<Task>('/Task', task);
    return response.data;
  }

  async setTaskPending(id: number): Promise<Task> {
    const response = await socialApiClient.patch<Task>(`/Task/${id}/pending`);
    return response.data;
  }

  async setTaskInProgress(id: number): Promise<Task> {
    const response = await socialApiClient.patch<Task>(`/Task/${id}/in-progress`);
    return response.data;
  }

  async setTaskInReview(id: number): Promise<Task> {
    const response = await socialApiClient.patch<Task>(`/Task/${id}/review`);
    return response.data;
  }

  async setTaskDone(id: number): Promise<Task> {
    const response = await socialApiClient.patch<Task>(`/Task/${id}/done`);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await socialApiClient.delete(`/Task/${id}`);
  }
}

export default new TaskService();