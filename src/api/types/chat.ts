export interface Chat {
  id: number;
  name: string;
  type: 'Общий' | 'Компании' | 'Личный' | 'Групповой';
  createdAt: string;
  unreadCount: number;
  lastMessage?: Message;
}

export interface Message {
  id: number;
  text: string;
  sentAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  chatId: number;
  sender: SimpleEmployee;
  replyTo?: Message;
  attachments: Attachment[];
}

export interface SimpleEmployee {
  id: number;
  fullName: string;
  photoPath?: string;
}

export interface CreateMessageRequest {
  text: string;
  replyToId?: number;
  attachments?: File[];
}

export interface SimpleEmployee {
  id: number;
  fullName: string;
  photoPath?: string;
}

export interface Attachment {
  id: number;
  fileUrl: string;
  type: 'Изображение' | 'Документ' | 'Видео' | 'Аудио';
}

// Интерфейсы для сообщений
export interface Message {
  id: number;
  text: string;
  sentAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  chatId: number;
  sender: SimpleEmployee;
  replyTo?: Message;
  isRead?: boolean; // Добавляем поле из бэкенда
}

export interface MessageResponse {
  id: number;
  text: string;
  sentAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  chatId: number;
  sender: SimpleEmployee;
  replyTo?: MessageResponse;
}

// DTO для запросов
export interface CreateMessageRequest {
  text: string;
  replyToId?: number;
  attachments?: File[];
}

export interface EditMessageRequest {
  newText: string;
}

// Типы для пагинации сообщений
export interface MessagesPagination {
  skip?: number;
  take?: number;
}

// Тип для ответа с сообщениями
export type MessagesResponse = MessageResponse[];