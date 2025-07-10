import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { authStorage } from '../utils/auth-storage';

export const useChatHub = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const createConnection = async () => {
      const token = authStorage.getAccessToken();
      if (!token) return;

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl('https://web.waypay.one:5001/chatHub', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      try {
        await newConnection.start();
        console.log('SignalR Connected');

        // Подписываемся на события
        newConnection.on('ReceiveGlobalMessage', (senderId, message, createdAt) => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: { id: senderId },
            text: message,
            timestamp: createdAt,
            isRead: true
          }]);
        });

        newConnection.on('ReceivePrivateMessage', (senderId, receiverId, message, createdAt) => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: { id: senderId },
            text: message,
            timestamp: createdAt,
            isRead: true
          }]);
        });

        setConnection(newConnection);
        connectionRef.current = newConnection;
      } catch (err) {
        console.log('SignalR Connection Error: ', err);
      }
    };

    createConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const sendGlobalMessage = async (message: string) => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('SendGlobalMessage', message);
      } catch (err) {
        console.error('Error sending message: ', err);
      }
    }
  };

  const sendPrivateMessage = async (receiverId: string, message: string) => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('SendPrivateMessage', receiverId, message);
      } catch (err) {
        console.error('Error sending private message: ', err);
      }
    }
  };

  const joinCompanyChat = async (companyId: string) => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('JoinCompanyChat', companyId);
      } catch (err) {
        console.error('Error joining company chat: ', err);
      }
    }
  };

  return {
    connection,
    messages,
    sendGlobalMessage,
    sendPrivateMessage,
    joinCompanyChat
  };
};