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

  async markTaskAsComplete(id: number): Promise<Task> {
    const response = await socialApiClient.put<Task>(`/Task/${id}/complete`);
    return response.data;
  }

  async verifyTask(id: number): Promise<Task> {
    const response = await socialApiClient.put<Task>(`/Task/${id}/verify`);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await socialApiClient.delete(`/Task/${id}`);
  }
}

export default new TaskService();