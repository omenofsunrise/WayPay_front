import { useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../client';
import { useAuth } from '../../сontext/AuthContext';

export interface WebSocketMessage {
  Type: string;
  Title: string;
  Body: string;
  Image?: string;
  Route?: string;
  Timestamp: string;
}

export const WHATSAPP_WS_EVENT = 'whatsapp-ws-message';
export const MOCK_WS_EVENT = 'mock-ws-message';
export type WhatsAppWsEvent = CustomEvent<WebSocketMessage>;

interface UseWebSocketProps {
  onNotification: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
}

declare global {
  interface Window {
    __mockWAMessage?: (phone: string, body: string) => void;
    __mockWSMessage?: (message: Partial<WebSocketMessage>) => void;
  }
}

export const useWebSocket = ({ onNotification, onError }: UseWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;
  const { authInfo } = useAuth();

  const processMessage = useCallback((message: WebSocketMessage) => {
    if (message?.Type === 'whats_app') {
      window.dispatchEvent(new CustomEvent(WHATSAPP_WS_EVENT, { detail: message }));
    }
    onNotification(message);
  }, [onNotification]);

  const connect = useCallback(() => {
    const employeeId = authInfo?.employee?.id;
    if (!employeeId) {
      console.log('⏳ WebSocket: employee.id not available, skipping connection');
      return;
    }

    try {
      const wsUrl = `${BASE_URL}/ws`;
      
      console.log('🔄 Connecting to WebSocket:', wsUrl);
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttemptsRef.current = 0;

        socketRef.current?.send(JSON.stringify({
          EmployeeId: employeeId,
        }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          console.log('📨 RAW WebSocket message received:', event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Parsed WebSocket message:', message);

          processMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
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
  }, [processMessage, onError, authInfo?.employee?.id]);

  const handleReconnect = useCallback(() => {
    const employeeId = authInfo?.employee?.id;
    if (!employeeId) {
      console.log('⏳ WebSocket: employee.id not available, skipping reconnection');
      return;
    }

    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
      setTimeout(() => connect(), delay);
    } else {
      console.error('🚨 Max reconnection attempts reached');
    }
  }, [connect, authInfo?.employee?.id]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    const employeeId = authInfo?.employee?.id;
    if (employeeId) {
      console.log('👤 Employee ID available, connecting WebSocket:', employeeId);
      connect();
    } else {
      console.log('⏳ Waiting for employee ID...');
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const employeeId = authInfo?.employee?.id;
        if (employeeId && (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
          console.log('🔄 Page visible, reconnecting WebSocket...');
          connect();
        }
      }
    };

    const handleMockMessage = (event: Event) => {
      const detail = (event as CustomEvent<WebSocketMessage>).detail;
      if (!detail) return;
      console.log('🧪 Mock WS message received:', detail);
      processMessage(detail);
    };

    window.__mockWSMessage = (partial: Partial<WebSocketMessage>) => {
      const message: WebSocketMessage = {
        Type: partial.Type ?? 'whats_app',
        Title: partial.Title ?? '79991234567',
        Body: partial.Body ?? 'Тестовое сообщение',
        Image: partial.Image,
        Route: partial.Route,
        Timestamp: partial.Timestamp ?? new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent(MOCK_WS_EVENT, { detail: message }));
    };

    window.__mockWAMessage = (phone: string, body: string) => {
      window.__mockWSMessage?.({ Type: 'whats_app', Title: phone, Body: body });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener(MOCK_WS_EVENT, handleMockMessage);

    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(MOCK_WS_EVENT, handleMockMessage);
      delete window.__mockWAMessage;
      delete window.__mockWSMessage;
    };
  }, [connect, disconnect, processMessage, authInfo?.employee?.id]);

  return {
    disconnect,
    reconnect: connect
  };
};