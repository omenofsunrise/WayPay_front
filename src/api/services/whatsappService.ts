import apiClient from "../client";
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
  SendMediaFormRequest,
  ChannelsResponse,
  CreateChannelRequest,
  ChannelResponse,
  EmployeeListRequest,
  ExtendChannelRequest,
  CreateBotRequest,
  BotResponse,
  UpdateBotRequest,
  AddBotResponseRequest,
  AddBotKeywordRequest,
  BotKeywordResponse,
  BotType,
  BotEventType,
  BotResponseTextType,
  SetBotEventRequest,
  GetBotsResponse,
} from "../types/whatsapp";

class WhatsAppService {
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (request.mediaData && request.fileName && request.mediaKind) {
      return this.sendMediaMessage(request);
    }

    const response = await apiClient.post<SendMessageResponse>(
      "/WhatsApp/send",
      {
        to: request.to,
        body: request.body,
      }
    );
    return response.data;
  }

  async sendMediaMessage(
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const response = await apiClient.post<SendMessageResponse>(
      "/WhatsApp/send",
      {
        to: request.to,
        mediaData: request.mediaData,
        fileName: request.fileName,
        mediaKind: request.mediaKind,
        caption: request.caption,
      }
    );
    return response.data;
  }

  async sendMediaFormData(
    request: SendMediaFormRequest
  ): Promise<SendMessageResponse> {
    const formData = new FormData();
    formData.append("To", request.to);
    formData.append("File", request.file);
    formData.append("MediaKind", request.mediaKind);
    if (request.caption) {
      formData.append("Caption", request.caption);
    }

    const response = await apiClient.post<SendMessageResponse>(
      "/WhatsApp/send-media",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 5 * 60 * 1000, // uploads can be slow; override the 10s global default
      }
    );
    return response.data;
  }

  async markAsRead(request: MarkAsReadRequest): Promise<void> {
    await apiClient.post("/WhatsApp/mark-read", request);
  }

  async deleteMessage(request: DeleteMessageRequest): Promise<void> {
    await apiClient.delete("/WhatsApp/message", { data: request });
  }

  async getQR(channelId: string): Promise<QRResponse> {
    const response = await apiClient.get<QRResponse>("/WhatsApp/qr", {
      params: { channelId },
    });
    return response.data;
  }

  async getChannelStatus(): Promise<ChannelStatusResponse> {
    const response = await apiClient.get<ChannelStatusResponse>(
      "/WhatsApp/status"
    );
    return response.data;
  }

  async findChatByPhone(
    request: FindChatByPhoneRequest
  ): Promise<FindChatByPhoneResponse> {
    const response = await apiClient.get<FindChatByPhoneResponse>(
      "/WhatsApp/find-chat-by-phone",
      {
        params: { clientPhone: request.clientPhone },
      }
    );
    return response.data;
  }

  async getChatWithClient(
    request: GetChatWithClientRequest
  ): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>(
      "/WhatsApp/chat-with-client",
      {
        params: {
          clientPhone: request.clientPhone,
          limit: request.limit || 50,
          offset: request.offset || 0,
          channelId: request.channelId || undefined,
        },
      }
    );
    return response.data;
  }

  async getChannels(): Promise<ChannelsResponse> {
    const response = await apiClient.get<ChannelsResponse>("/WhatsApp");
    return response.data;
  }

  async createChannel(
    name: string,
    employeeIds: number[]
  ): Promise<ChannelResponse> {
    const request: CreateChannelRequest = { name, employeeIds };
    const response = await apiClient.post<ChannelResponse>(
      "/WhatsApp",
      request
    );
    return response.data;
  }

  async setCurrentChannel(channelId: string): Promise<void> {
    await apiClient.patch(`/WhatsApp/set-current-channel/${channelId}`, {});
  }

  async logout(channelId: string): Promise<void> {
    await apiClient.post(`/WhatsApp/logout/${channelId}`);
  }

  async setChannelEmployees(
    channelId: string,
    employeeIds: number[]
  ): Promise<void> {
    const request: EmployeeListRequest = { employeesList: employeeIds };
    await apiClient.patch(`/WhatsApp/set/${channelId}`, request);
  }

  async deleteChannel(id: string) {
    await apiClient.delete(`/WhatsApp/channel/${id}`);
  }

  async extendChannel(days: number, channelId: string): Promise<string> {
    const request: ExtendChannelRequest = { days, channelId };
    const response = await apiClient.post<string>("/WhatsApp/extend", request);
    return response.data;
  }

  async createBot(
    channelId: string,
    name: string,
    botType: BotType
  ): Promise<BotResponse> {
    const request: CreateBotRequest = { channelId, name, botType };
    const response = await apiClient.post<BotResponse>(
      "/WhatsApp/bot",
      request
    );
    return response.data;
  }

  async updateBot(
    name: string,
    id: number,
    active: boolean
  ): Promise<BotResponse> {
    const request: UpdateBotRequest = { name, id, active };
    const response = await apiClient.put<BotResponse>("/WhatsApp/bot", request);
    return response.data;
  }

  async deleteBot(id: number): Promise<void> {
    await apiClient.delete(`/WhatsApp/bot/${id}`);
  }

  async setBotResponse(
    botId: number,
    response: string,
    type?: BotResponseTextType
  ): Promise<void> {
    const request: AddBotResponseRequest = type
      ? { botId, response, type }
      : { botId, response };
    await apiClient.post("/WhatsApp/bot/response", request);
  }

  async setBotEvent(botId: number, eventType: BotEventType): Promise<void> {
    const request: SetBotEventRequest = { botId, eventType };
    await apiClient.patch("/WhatsApp/bot/event", request);
  }

  async addBotKeyword(
    botId: number,
    matchType: AddBotKeywordRequest["type"],
    keyword: string
  ): Promise<BotKeywordResponse> {
    const request: AddBotKeywordRequest = { botId, type: matchType, keyword };
    const response = await apiClient.post<BotKeywordResponse>(
      "/WhatsApp/bot/keyword",
      request
    );
    return response.data;
  }

  async deleteBotKeyword(id: number): Promise<void> {
    await apiClient.delete(`/WhatsApp/bot/keyword/${id}`);
  }

  async getBotsByChannel(channelId: string): Promise<BotResponse[]> {
    const response = await apiClient.get<GetBotsResponse>(
      `/WhatsApp/channel/${channelId}/bots`
    );
    return response.data.bots;
  }
}

export default new WhatsAppService();
