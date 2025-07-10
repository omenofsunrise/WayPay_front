export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: User;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  users: User[];
  messages: Message[];
  unreadCount: number;
  lastMessage: Message;
  isPrivate: boolean;
  companyId?: string;
}