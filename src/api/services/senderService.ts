import apiClient from '../client';
import type { CreateSenderSetting, SenderInfoResponse, SetSenderTextRequest } from '../types/sender';

class SenderService {
    async getMyCompanySenderInfo(): Promise<SenderInfoResponse> {
        const response = await apiClient.get<SenderInfoResponse>(
            '/SenderSettings',
        );
        return response.data;
    }

    async ToggleSenderActivity(): Promise<void> {
        await apiClient.patch(`/SenderSettings/toggle/sender`);
    }

    async ToggleShouldAutoBuy(): Promise<void> {
        await apiClient.patch(`/SenderSettings/toggle/should-auto-buy`);
    }

    async SetSenderTextPattern(request: SetSenderTextRequest): Promise<void> {
        await apiClient.patch(`/SenderSettings/set-text-pattern`, request);
    }

    async CreateSenderSetting(request: CreateSenderSetting): Promise<void> {
        await apiClient.post(`/SenderSettings`, request);
    }

    async DeleteSenderSetting(id: number): Promise<void> {
        await apiClient.delete(`/SenderSettings/${id}`);
    }

    async BuyMessages(days: number): Promise<void> {
        await apiClient.post(`/SenderSettings/buy-messages`, days);
    }
}

export default new SenderService();