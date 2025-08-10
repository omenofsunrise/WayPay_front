import socialApiClient from '../socialApiClient';
import type { TaskNote, TaskNoteCreateDto, TaskNoteUpdateDto } from '../types/taskNote';

class TaskNoteService {
  async getNotesByTaskId(taskId: number): Promise<TaskNote[]> {
    const response = await socialApiClient.get<TaskNote[]>(`/TaskNote/task/${taskId}`);
    return response.data;
  }

  async getNoteById(id: number): Promise<TaskNote> {
    const response = await socialApiClient.get<TaskNote>(`/TaskNote/${id}`);
    return response.data;
  }

  async createNote(noteDto: TaskNoteCreateDto): Promise<TaskNote> {
    const response = await socialApiClient.post<TaskNote>('/TaskNote', noteDto);
    return response.data;
  }

  async updateNote(id: number, noteDto: TaskNoteUpdateDto): Promise<void> {
    await socialApiClient.put(`/TaskNote/${id}`, noteDto);
  }

  async deleteNote(id: number): Promise<void> {
    await socialApiClient.delete(`/TaskNote/${id}`);
  }
}

export default new TaskNoteService();