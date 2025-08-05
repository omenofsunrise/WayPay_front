import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useEffect, useState, useCallback } from 'react';
import { useEmployee } from './useEmployee';
import { authStorage } from '../utils/auth-storage';
import type { Message } from '../types/chat';
import useChat from './useChat';

export const useSignalR = () => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const { authInfo } = useEmployee();
  const token = authStorage.getAccessToken();;
  const {
    chats,
    messages,
    currentChat,
    isLoading,
    error,
    searchQuery,
    messageSearchQuery,
    fetchUserChats,
    fetchChatMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    selectChat,
    searchChats,
    searchMessages,
    attachments,
    previewAttachments,
    addAttachments,
    removeAttachment,
    setAttachments,
    setPreviewAttachments,
    chatMembers,
    fetchChatMembers
  } = useChat();

  const startConnection = useCallback(async () => {
    if (!token) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${"http://test.waypay.one:5003"}/chatHub`, {
          accessTokenFactory: () => token
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      await newConnection.start();
      setConnection(newConnection);
    } catch (e) {
      console.error('SignalR Connection Error: ', e);
    }
  }, [token]);

  const stopConnection = useCallback(async () => {
    if (connection) {
      try {
        await connection.stop();
      } catch (e) {
        console.error('SignalR Disconnection Error: ', e);
      } finally {
        setConnection(null);
      }
    }
  }, [connection]);

  const addNewMessage = useCallback((newMessage: Message) => {
    setMessages(prev => {
      // Проверяем, нет ли уже такого сообщения
      if (prev.some(m => m.id === newMessage.id)) return prev;
      
      // Добавляем новое сообщение в начало списка
      return [...prev, newMessage];
    });
    
    setChats(prev => prev.map(chat => {
      if (chat.id === newMessage.chatId) {
        return {
          ...chat,
          lastMessage: newMessage,
          unreadCount: chat.id === currentChat?.id ? 0 : chat.unreadCount + 1
        };
      }
      return chat;
    }));
  }, [currentChat]);
  
  useEffect(() => {
    startConnection();

    return () => {
      stopConnection();
    };
  }, [startConnection, stopConnection]);

  return { connection };
};