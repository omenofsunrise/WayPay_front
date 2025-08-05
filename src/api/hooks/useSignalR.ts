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

  const startConnection = useCallback(async () => {
    if (!token) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_SOCIAL_BASE_URL}/chatHub`, {
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
  
  useEffect(() => {
    startConnection();

    return () => {
      stopConnection();
    };
  }, [startConnection, stopConnection]);

  return { connection };
};