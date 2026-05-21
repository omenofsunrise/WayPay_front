import apiClient from '../client';
import type { AxiosRequestConfig } from 'axios';
import type { CreateSenderSetting, SenderInfoResponse, SetSenderTextRequest } from '../types/sender';

const fetchUtf8Text = async (url: string, config?: AxiosRequestConfig): Promise<string> => {
    const response = await apiClient.get<ArrayBuffer>(url, { ...config, responseType: 'arraybuffer' });
    const text = new TextDecoder('utf-8').decode(response.data);
    if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }
    return text;
};

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
        return fetchUtf8Text(`/SenderSettings/filled/payments/${creditId}`);
    }

    async getFilledCredit(creditId: number): Promise<string> {
        return fetchUtf8Text(`/SenderSettings/credit/filled/${creditId}`);
    }

    async getFilledGuarantorSchedule(scheduleId: number): Promise<string> {
        return fetchUtf8Text(`/SenderSettings/guarantor/schedule/filled/${scheduleId}`);
    }

    async getFilledCredits(creditIds: number[]): Promise<string> {
        return fetchUtf8Text(`/SenderSettings/credits/filled`, {
            params: { creditIds },
            paramsSerializer: {
                indexes: null
            }
        });
    }
}

export default new SenderService();