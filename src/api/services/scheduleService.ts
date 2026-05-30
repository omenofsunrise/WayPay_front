import apiClient from '../client';
import type { 
    ScheduleItem, 
    ScheduleDetails, 
    ScheduleParams, 
    SchedulePreviewParams,
    ScheduleCalendarParams,
    UpdateScheduleRequest
} from '../types/schedule';
import type { PaginatedResponse } from '../types/common';

class ScheduleService {
    async getList(params?: ScheduleParams): Promise<PaginatedResponse<ScheduleDetails>> {
        const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
            '/Schedule',
            { params }
        );
        return response.data;
    }

    async getByCreditId(
        creditId: number, 
        params?: Omit<ScheduleParams, 'creditId'>
    ): Promise<PaginatedResponse<ScheduleDetails>> {
        const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
            `/Schedule/by-credit/${creditId}`,
            { params }
        );
        return response.data;
    }

    async getById(id: number): Promise<ScheduleDetails> {
        const response = await apiClient.get<ScheduleDetails>(`/Schedule/${id}`);
        return response.data;
    }

    async getCalendar(params?: ScheduleCalendarParams): Promise<ScheduleDetails[]> {
        const response = await apiClient.get<ScheduleDetails[] | PaginatedResponse<ScheduleDetails>>('/Schedule/calendar', { params });
        const data = response.data;

        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.items)) {
            return data.items;
        }

        return [];
    }

    async markAsNotified(id: number): Promise<void> {
        await apiClient.put(`/Schedule/${id}`);
    }

    async updateDate(id: number, date: string): Promise<void> {
        await apiClient.put('/Schedule', { id, date });
    }

    async updateSchedule(request: UpdateScheduleRequest): Promise<void> {
        await apiClient.put('/Schedule', request);
    }

    async getPreview(params: SchedulePreviewParams): Promise<ScheduleItem[]> {
        const response = await apiClient.post<ScheduleItem[]>(
            '/Schedule/preview',
            params
        );
        return response.data;
    }
}

export default new ScheduleService();
