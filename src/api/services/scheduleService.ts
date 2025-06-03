import apiClient from '../client';
import type { 
    ScheduleItem, 
    ScheduleDetails, 
    ScheduleParams, 
    SchedulePreviewParams 
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

    async noticeNotified(id: number) {
        await apiClient.put(`/Schedule/${id}`);
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