import apiClient from "../client";
import type {
  BlacklistCandidate,
  CandidatePage,
  CandidateQuery,
  CandidateUpdate,
  CollectorAccount,
  CollectorAccountSettings,
  CollectorChat,
  CollectorStatus,
  LoginResult,
  QrLoginState,
} from "../types/telegramCollector";

const BASE = "/TelegramCollector";

class TelegramCollectorService {
  async getStatus(): Promise<CollectorStatus> {
    const { data } = await apiClient.get<CollectorStatus>(`${BASE}/status`);
    return data;
  }

  /** Снова разобрать сообщения, на которых нейросеть ответила ошибкой. */
  async retryFailed(): Promise<string> {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/retry-failed`);
    return data.message;
  }

  async getAccounts(): Promise<CollectorAccount[]> {
    const { data } = await apiClient.get<CollectorAccount[]>(`${BASE}/accounts`);
    return data;
  }

  /** Шаг 1 входа: номер. Telegram пришлёт код в приложение. */
  async startLogin(phone: string): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>(`${BASE}/accounts/login`, { phone });
    return data;
  }

  /** Шаг 2/3 входа: код из Telegram или облачный пароль. */
  async continueLogin(accountId: number, value: string): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>(
      `${BASE}/accounts/${accountId}/login`,
      { value }
    );
    return data;
  }

  /** Код не пришёл: Telegram пришлёт его следующим способом (SMS, звонок). */
  async resendCode(accountId: number): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>(
      `${BASE}/accounts/${accountId}/login/resend`
    );
    return data;
  }

  /** Вход по QR-коду: код из Telegram не нужен. */
  async startQrLogin(): Promise<QrLoginState> {
    const { data } = await apiClient.post<QrLoginState>(`${BASE}/accounts/login/qr`);
    return data;
  }

  async getQrLogin(qrId: string): Promise<QrLoginState> {
    const { data } = await apiClient.get<QrLoginState>(`${BASE}/accounts/login/qr/${qrId}`);
    return data;
  }

  async submitQrPassword(qrId: string, value: string): Promise<QrLoginState> {
    const { data } = await apiClient.post<QrLoginState>(`${BASE}/accounts/login/qr/${qrId}/password`, { value });
    return data;
  }

  async cancelQrLogin(qrId: string): Promise<void> {
    await apiClient.post(`${BASE}/accounts/login/qr/${qrId}/cancel`);
  }

  async logout(accountId: number): Promise<void> {
    await apiClient.post(`${BASE}/accounts/${accountId}/logout`);
  }

  async updateSettings(accountId: number, settings: CollectorAccountSettings): Promise<void> {
    await apiClient.put(`${BASE}/accounts/${accountId}/settings`, settings);
  }

  async getChats(accountId: number): Promise<CollectorChat[]> {
    const { data } = await apiClient.get<CollectorChat[]>(`${BASE}/accounts/${accountId}/chats`);
    return data;
  }

  async refreshChats(accountId: number): Promise<void> {
    await apiClient.post(`${BASE}/accounts/${accountId}/chats/refresh`);
  }

  async setChatEnabled(chatId: number, enabled: boolean): Promise<void> {
    await apiClient.put(`${BASE}/chats/${chatId}`, { enabled });
  }

  async loadHistory(chatId: number, days: number): Promise<string> {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/chats/${chatId}/history`, {
      days,
    });
    return data.message;
  }

  async getCandidates(query: CandidateQuery): Promise<CandidatePage> {
    const { data } = await apiClient.get<CandidatePage>(`${BASE}/candidates`, { params: query });
    return data;
  }

  async updateCandidate(id: number, update: CandidateUpdate): Promise<BlacklistCandidate> {
    const { data } = await apiClient.put<BlacklistCandidate>(`${BASE}/candidates/${id}`, update);
    return data;
  }

  async approve(id: number): Promise<BlacklistCandidate> {
    const { data } = await apiClient.post<BlacklistCandidate>(`${BASE}/candidates/${id}/approve`);
    return data;
  }

  async reject(id: number): Promise<BlacklistCandidate> {
    const { data } = await apiClient.post<BlacklistCandidate>(`${BASE}/candidates/${id}/reject`);
    return data;
  }

  async reopen(id: number): Promise<BlacklistCandidate> {
    const { data } = await apiClient.post<BlacklistCandidate>(`${BASE}/candidates/${id}/reopen`);
    return data;
  }
}

export default new TelegramCollectorService();