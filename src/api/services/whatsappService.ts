import apiClient from '../client';
import type { 
  SendMessageRequest, 
  SendMessageResponse, 
  MarkAsReadRequest,
  DeleteMessageRequest,
  QRResponse,
  ChannelStatusResponse,
  FindChatByPhoneRequest,
  FindChatByPhoneResponse,
  GetChatWithClientRequest,
  ChatHistoryResponse,
} from '../types/whatsapp';

class WhatsAppService {
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await apiClient.post<SendMessageResponse>('/WhatsApp/send', request);
    return response.data;
  }

  async markAsRead(request: MarkAsReadRequest): Promise<void> {
    await apiClient.post('/WhatsApp/mark-read', request);
  }

  async deleteMessage(request: DeleteMessageRequest): Promise<void> {
    await apiClient.delete('/WhatsApp/message', { data: request });
  }

  async getQR(userId: string): Promise<QRResponse> {
    const response = await apiClient.get<QRResponse>('/WhatsApp/qr', {
      params: { userId }
    });
    return response.data;
  }

  async getChannelStatus(): Promise<ChannelStatusResponse> {
    const response = await apiClient.get<ChannelStatusResponse>('/WhatsApp/status');
    return response.data;
  }

  async findChatByPhone(request: FindChatByPhoneRequest): Promise<FindChatByPhoneResponse> {
    const response = await apiClient.get<FindChatByPhoneResponse>('/WhatsApp/find-chat-by-phone', {
      params: { clientPhone: request.clientPhone }
    });
    return response.data;
  }

  async getChatWithClient(request: GetChatWithClientRequest): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>('/WhatsApp/chat-with-client', {
      params: { 
        clientPhone: request.clientPhone,
        limit: request.limit || 50,
        offset: request.offset || 0
      }
    });
    return response.data;
  }
}

export default new WhatsAppService();