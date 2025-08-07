import socialApiClient from '../socialApiClient';
import type { 
  Chat, 
  Message, 
  CreateMessageRequest, 
  MessageResponse,
  MessagesPagination,
  MessagesResponse,
  ChatMember,
  MessageAttachmentResponse,
  ChatLinkResponse
} from '../types/chat';

class ChatService {
  async getUserChats(search?: string): Promise<Chat[]> {
    const response = await socialApiClient.get<Chat[]>('/chats/my', {
      params: { search }
    });
    return response.data;
  }

  async getOrCreatePrivateChat(targetUserId: number): Promise<Chat> {
    const response = await socialApiClient.get<Chat>(`/chats/private/${targetUserId}`);
    return response.data;
  }

  async getCompanyChat(): Promise<Chat> {
    const response = await socialApiClient.get<Chat>('/chats/company');
    return response.data;
  }

  async getGlobalChat(): Promise<Chat> {
    const response = await socialApiClient.get<Chat>('/chats/global');
    return response.data;
  }

  /**
   * Получить сообщения чата
   * @param chatId ID чата
   * @param params Параметры пагинации
   */
  async getChatMessages(
    chatId: number, 
    params?: MessagesPagination & { search?: string }
  ): Promise<MessagesResponse> {
    const { skip = 0, take = 50, search } = params || {};
    const response = await socialApiClient.get<MessagesResponse>(
      `/chats/${chatId}/messages`,
      { params: { skip, take, search } }
    );
    return response.data;
  }

  /**
   * Отправить сообщение
   * @param chatId ID чата
   * @param messageData Данные сообщения
   */
  async sendMessage(
    chatId: number, 
    messageData: CreateMessageRequest
  ): Promise<MessageResponse> {
    const formData = new FormData();
    formData.append('text', messageData.text);
    
    if (messageData.replyToId) {
      formData.append('replyToId', messageData.replyToId.toString());
    }

    // Добавляем postId, если он есть
    if (messageData.postId) {
      formData.append('postId', messageData.postId.toString());
    }
    
    if (messageData.attachments) {
      messageData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await socialApiClient.post<MessageResponse>(
      `/chats/${chatId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  /**
   * Редактировать сообщение
   * @param chatId ID чата
   * @param messageId ID сообщения
   * @param newText Новый текст сообщения
   */
  async editMessage(
    chatId: number, 
    messageId: number, 
    newText: string
  ): Promise<MessageResponse> {
    const response = await socialApiClient.put<MessageResponse>(
      `/chats/${chatId}/messages/${messageId}`,
      newText
    );
    return response.data;
  }

  /**
   * Удалить сообщение
   * @param chatId ID чата
   * @param messageId ID сообщения
   */
  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    await socialApiClient.delete(`/chats/${chatId}/messages/${messageId}`);
  }

  /**
   * Пометить сообщения как прочитанные
   * @param chatId ID чата
   */
  async readMessages(chatId: number): Promise<void> {
    await socialApiClient.post(`/chats/${chatId}/messages/read`);
  }

  /**
   * Get photos from chat
   * @param chatId ID of the chat
   * @param params Pagination parameters
   */
  async getChatPhotos(
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[]> {
    const { skip = 0, take = 20 } = params || {};
    const response = await socialApiClient.get<MessageAttachmentResponse[]>(
      `/chats/${chatId}/photos`,
      { params: { skip, take } }
    );
    return response.data;
  }

  /**
   * Get files from chat
   * @param chatId ID of the chat
   * @param params Pagination parameters
   */
  async getChatFiles(
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[]> {
    const { skip = 0, take = 20 } = params || {};
    const response = await socialApiClient.get<MessageAttachmentResponse[]>(
      `/chats/${chatId}/files`,
      { params: { skip, take } }
    );
    return response.data;
  }

  /**
   * Get videos from chat
   * @param chatId ID of the chat
   * @param params Pagination parameters
   */
  async getChatVideos(
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[]> {
    const { skip = 0, take = 20 } = params || {};
    const response = await socialApiClient.get<MessageAttachmentResponse[]>(
      `/chats/${chatId}/videos`,
      { params: { skip, take } }
    );
    return response.data;
  }

  /**
   * Get links from chat
   * @param chatId ID of the chat
   * @param params Pagination parameters
   */
  async getChatLinks(
    chatId: number, 
    params?: MessagesPagination
  ): Promise<ChatLinkResponse[]> {
    const { skip = 0, take = 20 } = params || {};
    const response = await socialApiClient.get<ChatLinkResponse[]>(
      `/chats/${chatId}/links`,
      { params: { skip, take } }
    );
    return response.data;
  }
  
  async getChatMembers(chatId: number): Promise<ChatMember[]> {
    const response = await socialApiClient.get<ChatMember[]>(`/chats/${chatId}/members`);
    return response.data;
  }

  async deleteChat(userId: number) {
    const response = await socialApiClient.delete(`/chats/private/${userId}`);
    return response.data;
  }

  async createPrivateChat(userId: number): Promise<Chat> {
    const response = await socialApiClient.get<Chat>(`/chats/private/${userId}`);
    return response.data;
  }
}

export default new ChatService();