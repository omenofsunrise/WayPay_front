import apiClient from "../client";
import type {
  WhatsAppSender,
  UpsertWhatsAppSenderRequest,
  SenderReport,
  SenderReportDetails,
  SenderReportDetailsParams,
} from "../types/whatsappSender";

class WhatsAppSenderService {
  // 1) CRUD рассылок
  async getSenders(): Promise<WhatsAppSender[]> {
    const response = await apiClient.get<WhatsAppSender[]>("/WhatsAppSender");
    return response.data;
  }

  async createSender(body: UpsertWhatsAppSenderRequest): Promise<void> {
    await apiClient.post("/WhatsAppSender", body);
  }

  async updateSender(
    senderId: number,
    body: UpsertWhatsAppSenderRequest
  ): Promise<void> {
    await apiClient.put(`/WhatsAppSender/${senderId}`, body);
  }

  async deleteSender(senderId: number): Promise<void> {
    await apiClient.delete(`/WhatsAppSender/${senderId}`);
  }

  // 2) Установить ботов для рассылки (перезапись списка)
  async setSenderBots(senderId: number, botIds: number[]): Promise<void> {
    await apiClient.patch(`/WhatsAppSender/${senderId}`, botIds);
  }

  // 3) Отчёты
  async getReport(date?: string): Promise<SenderReport> {
    const response = await apiClient.get<SenderReport>(
      "/WhatsAppSender/report",
      { params: date ? { date } : undefined }
    );
    return response.data;
  }

  async getReportDetails(
    params: SenderReportDetailsParams
  ): Promise<SenderReportDetails> {
    const response = await apiClient.get<SenderReportDetails>(
      "/WhatsAppSender/report/details",
      { params }
    );
    return response.data;
  }
}

export default new WhatsAppSenderService();
