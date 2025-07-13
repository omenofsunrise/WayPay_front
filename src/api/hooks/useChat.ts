import { useState, useCallback, useEffect } from 'react';
import chatService from '../services/chatService';
import type { 
  Chat, 
  Message, 
  CreateMessageRequest,
  MessagesPagination,
  SimpleEmployee
} from '../types/chat';

const toMessage = (response: Message): Message => ({
  ...response,
});

const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [pagination, setPagination] = useState<MessagesPagination>({ skip: 0, take: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  const fetchUserChats = useCallback(async (search?: string): Promise<Chat[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getUserChats(search);
      setChats(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchChats = useCallback(async (query: string) => {
    setSearchQuery(query);
    await fetchUserChats(query);
  }, [fetchUserChats]);

  const fetchChatMessages = useCallback(async (
    chatId: number, 
    params?: MessagesPagination & { search?: string },
    loadMore: boolean = false
  ): Promise<Message[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatMessages(chatId, params);
      const newMessages = result.map(toMessage);
      
      setMessages(prev => loadMore 
        ? [...newMessages, ...prev] 
        : newMessages
      );
      
      if (!loadMore) {
        setPagination({ skip: 0, take: 20 });
      }
      
      return newMessages;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMessages = useCallback(async (query: string) => {
    setMessageSearchQuery(query);
    if (currentChat) {
      await fetchChatMessages(currentChat.id, { ...pagination, search: query });
    }
  }, [currentChat, fetchChatMessages, pagination]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentChat) return null;
    const newSkip = (pagination.skip || 0) + (pagination.take || 20);
    setPagination(prev => ({ ...prev, skip: newSkip }));
    return fetchChatMessages(currentChat.id, { ...pagination, skip: newSkip }, true);
  }, [currentChat, pagination, fetchChatMessages]);

  const sendMessage = useCallback(async (
    chatId: number, 
    messageData: CreateMessageRequest
  ): Promise<Message | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Optimistic update
      const tempMessage: Message = {
        id: Date.now(), // temporary ID
        text: messageData.text,
        sentAt: new Date().toISOString(),
        isDeleted: false,
        chatId,
        sender: {} as SimpleEmployee, // You should provide actual sender data
        attachments: [],
        isRead: false
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const result = await chatService.sendMessage(chatId, messageData);
      const message = toMessage(result);
      
      // Replace temporary message with actual one
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMessage.id),
        message
      ]);
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { 
          ...chat, 
          lastMessage: message,
          unreadCount: 0 
        } : chat
      ));
      
      return message;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempMessage?.id));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const editMessage = useCallback(async (
    chatId: number,
    messageId: number,
    newText: string
  ): Promise<Message | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.editMessage(chatId, messageId, newText);
      const message = toMessage(result);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? message : msg
      ));
      
      // Update last message if this was the last one
      setChats(prev => prev.map(chat => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          lastMessage: chat.lastMessage?.id === messageId 
            ? message 
            : chat.lastMessage
        };
      }));
      
      return message;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit message';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMessage = useCallback(async (
    chatId: number,
    messageId: number
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await chatService.deleteMessage(chatId, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete message';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (chatId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await chatService.readMessages(chatId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark messages as read';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectChat = useCallback((chat: Chat) => {
    setCurrentChat(chat);
    fetchChatMessages(chat.id);
    markMessagesAsRead(chat.id);
  }, [fetchChatMessages, markMessagesAsRead]);

  return {
    isLoading,
    error,
    chats,
    messages,
    currentChat,
    pagination,
    searchQuery,
    fetchUserChats,
    fetchChatMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    selectChat,
    searchChats,
    messageSearchQuery,
    searchMessages,
  };
};

export default useChat;