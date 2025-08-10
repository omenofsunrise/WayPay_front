import type { Employee } from "./employee";
import type { Task } from "./task";

export interface TaskNote {
  id: number;
  text: string;
  taskId: number;
  createdAt: Date;
  createdBy: number;
  creator: Employee;
  task: Task;
}

export interface TaskNoteCreateDto {
  text: string;
  taskId: number;
  createdBy: number;
}

export interface TaskNoteUpdateDto {
  text: string;
}