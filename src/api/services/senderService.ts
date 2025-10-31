import apiClient from '../client';
import type { SenderInfoResponse, SetSenderTextRequest } from '../types/sender';

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

    async CreateSenderSetting(request: SetSenderTextRequest): Promise<void> {
        await apiClient.post(`/SenderSettings/toggle/should-auto-buy`, request);
    }
}

export default new SenderService();