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

    async getFilledPayments(creditId: number): Promise<string> {
        const response = await apiClient.get<string>(`/SenderSettings/filled/payments/${creditId}`);
        return response.data;
    }

    async getFilledCredit(creditId: number): Promise<string> {
        const response = await apiClient.get<string>(`/SenderSettings/credit/filled/${creditId}`);
        return response.data;
    }

    async getFilledGuarantorSchedule(scheduleId: number): Promise<string> {
        const response = await apiClient.get<string>(`/SenderSettings/guarantor/schedule/filled/${scheduleId}`);
        return response.data;
    }

    async getFilledCredits(creditIds: number[]): Promise<string> {
        const response = await apiClient.get<string>(`/SenderSettings/credits/filled`, {
            params: { creditIds },
            paramsSerializer: {
                indexes: null
            }
        });
        return response.data;
    }
}

export default new SenderService();