import { useState, useCallback, useEffect, useRef } from 'react';
import chatService from '../services/chatService';
import type { 
  Chat, 
  Message, 
  CreateMessageRequest,
  MessagesPagination,
  SimpleEmployee,
  ChatMember,
  MessageAttachmentResponse,
  ChatLinkResponse
} from '../types/chat';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useEmployee } from './useEmployee';

const toMessage = (response: Message): Message => ({
  ...response,
  attachments: response.attachments || []
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewAttachments, setPreviewAttachments] = useState<Array<{url: string, file: File}>>([]);
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [chatPhotos, setChatPhotos] = useState<MessageAttachmentResponse[]>([]);
  const [chatFiles, setChatFiles] = useState<MessageAttachmentResponse[]>([]);
  const [chatVideos, setChatVideos] = useState<MessageAttachmentResponse[]>([]);
  const [chatLinks, setChatLinks] = useState<ChatLinkResponse[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const { authInfo } = useEmployee();
  
  useEffect(() => {
    const startConnection = async () => {
      try {
        const newConnection = new HubConnectionBuilder()
          .withUrl(`${import.meta.env.VITE_SOCIAL_BASE_URL}/chatHub`, {
            accessTokenFactory: () => localStorage.getItem('accessToken') || ''
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        await newConnection.start();
        setConnection(newConnection);

        newConnection.on('ReceiveMessage', handleNewMessage);
        newConnection.on('UserTyping', handleUserTyping);
        
        newConnection.onclose(() => {
          console.log('Connection closed, attempting to reconnect...');
          setTimeout(startConnection, 5000);
        });

      } catch (err) {
        console.error('SignalR Connection Error:', err);
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection.off('ReceiveMessage');
        connection.off('UserTyping');
        connection.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!connection || !currentChat) return;
    
    connection.invoke('JoinChat', currentChat.id)
      .catch(err => console.error('Error joining chat:', err));
      
    return () => {
      connection.invoke('LeaveChat', currentChat.id)
        .catch(err => console.error('Error leaving chat:', err));
    };
  }, [connection, currentChat]);

  const handleNewMessage = useCallback((newMessage: Message) => {
    const formattedMessage = toMessage(newMessage);
    
    setMessages(prev => {
      // Проверяем, нет ли уже такого сообщения
      if (prev.some(m => m.id === newMessage.id)) return prev;
      
      return [...prev, formattedMessage];
    });
    
    setChats(prev => prev.map(chat => {
      if (chat.id === newMessage.chatId) {
        return {
          ...chat,
          lastMessage: formattedMessage,
          unreadCount: chat.id === currentChat?.id ? 0 : (chat.unreadCount || 0) + 1
        };
      }
      return chat;
    }));
  }, [currentChat]);

  const handleUserTyping = useCallback((chatId: number, userId: number, userName: string) => {
    if (currentChat?.id === chatId) {
      console.log(`${userName} печатает...`);
    }
  }, [currentChat]);

  const notifyTyping = useCallback(() => {
    if (!connection || !currentChat || !authInfo?.employee) return;
    
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      connection.invoke('NotifyTyping', currentChat.id, authInfo.employee.id, authInfo.employee.fullName)
        .catch(err => console.error('Error notifying typing:', err));
      lastTypingTimeRef.current = now;
    }
  }, [connection, currentChat, authInfo]);

  const fetchChatPhotos = useCallback(async (
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatPhotos(chatId, params);
      setChatPhotos(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chat photos';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChatFiles = useCallback(async (
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatFiles(chatId, params);
      setChatFiles(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chat files';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPrivateChat = useCallback(async (userId: number): Promise<Chat> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.createPrivateChat(userId);
      
      setChats(prev => [...prev, result]);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create private chat';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChatVideos = useCallback(async (
    chatId: number, 
    params?: MessagesPagination
  ): Promise<MessageAttachmentResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatVideos(chatId, params);
      setChatVideos(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chat videos';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChatLinks = useCallback(async (
    chatId: number, 
    params?: MessagesPagination
  ): Promise<ChatLinkResponse[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatLinks(chatId, params);
      setChatLinks(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chat links';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAttachments = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files);
    setAttachments(prev => [...prev, ...newFiles]);
    
    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    setPreviewAttachments(prev => [...prev, ...newPreviews]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviewAttachments(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].url);
      return newPreviews;
    });
  }, []);

  useEffect(() => {
    return () => {
      previewAttachments.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [previewAttachments]);

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

  const getUnreadChatsCount = useCallback(async (): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getUnreadChatsCount();
            
      return result;
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
    
    let tempMessage: Message | null = null;
    
    try {
      tempMessage = {
        id: Date.now(),
        text: messageData.text,
        sentAt: new Date().toISOString(),
        isDeleted: false,
        chatId,
        sender: {} as SimpleEmployee,
        attachments: messageData.attachments?.map((file, index) => ({
          id: Date.now() + index,
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          contentType: file.type
        })) || [],
        isRead: true,
        postId: messageData.postId // Добавьте это
      };
      
      const result = await chatService.sendMessage(chatId, {
        ...messageData,
        attachments: messageData.attachments
      });
      
      const message = toMessage(result);
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { 
          ...chat, 
          lastMessage: message,
          unreadCount: 0 
        } : chat
      ));
      
      setAttachments([]);
      setPreviewAttachments([]);
      
      return message;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      if (tempMessage) {
        setMessages(prev => prev.filter(m => m.id !== tempMessage?.id));
      }
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

  const fetchChatMembers = useCallback(async (chatId: number): Promise<ChatMember[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatService.getChatMembers(chatId);
      setChatMembers(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chat members';
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

  const deleteChat = useCallback(async (
    userId: number,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await chatService.deleteChat(userId);
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
    attachments,
    previewAttachments,
    addAttachments,
    removeAttachment,
    setAttachments,
    setPreviewAttachments,
    chatMembers,
    fetchChatMembers,
    chatPhotos,
    chatFiles,
    chatVideos,
    chatLinks,
    fetchChatPhotos,
    fetchChatFiles,
    fetchChatVideos,
    fetchChatLinks,
    notifyTyping,
    createPrivateChat,
    deleteChat,
    getUnreadChatsCount
  };
};

export default useChat;