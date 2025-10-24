import { useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../client';
import { useAuth } from '../../сontext/AuthContext';
import { authStorage } from '../utils/auth-storage';

interface WebSocketMessage {
  type: string;
  title: string;
  body: string;
  image?: string;
  route?: string;
  timestamp: string;
}

interface UseWebSocketProps {
  onNotification: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({ onNotification, onError }: UseWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;
  const { authInfo } = useAuth();

  const connect = useCallback(() => {
    try {
      const wsUrl = `${BASE_URL}/ws`;
      
      console.log('🔄 Connecting to WebSocket:', wsUrl);
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttemptsRef.current = 0;

        const employeeId = authInfo.employee.id;
        if (employeeId) {
          socketRef.current?.send(JSON.stringify({
            employeeId: employeeId,
            token: authStorage.getAccessToken()
          }));
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          
          if (message.type === 'notification') {
            onNotification(message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        handleReconnect();
      };

      socketRef.current.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('💥 WebSocket connection failed:', error);
      handleReconnect();
    }
  }, [onNotification, onError]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
      setTimeout(() => connect(), delay);
    } else {
      console.error('🚨 Max reconnection attempts reached');
    }
  }, [connect]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (!document.hidden && (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        console.log('🔄 Page visible, reconnecting WebSocket...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, disconnect]);

  return {
    disconnect,
    reconnect: connect
  };
};