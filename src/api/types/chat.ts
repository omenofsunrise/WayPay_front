export interface Chat {
  id: number;
  name: string;
  type: 'general' | 'company' | 'private' | 'private_chat';
  createdAt: string;
  unreadCount: number;
  lastMessage?: Message;
  avatarPath?: string;
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
  fileName: string;
  contentType: string;
  fileSize?: number;
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
  isRead?: boolean;
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

export interface EditMessageRequest {
  newText: string;
}

export interface MessagesPagination {
  skip?: number;
  take?: number;
}

export type MessagesResponse = MessageResponse[];