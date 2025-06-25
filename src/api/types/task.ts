import type { PaginationParams } from "./common";

export interface Task {
  id: number;
  title: string;
  employeeId: number;
  responsibleId: number;
  deadline: Date;
  priority: 'low' | 'medium' | 'high';
  taskStatus: 'pending' | 'in_progress' | 'done' | 'review';
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date;
  createdBy: Number;
  employeeFullName: string;
  employeePhotoPath: string;
  responsibleFullName: string;
}

export interface TaskParams extends PaginationParams {
  title?: string;
  employeeId?: number;
  taskEmployeeId?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'done' | 'review';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onlyMine?: boolean;
  includeCompleted?: boolean;
}

export interface TaskForm {
  title: string;
  employeeId: number;
  responsibleId: number;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
}