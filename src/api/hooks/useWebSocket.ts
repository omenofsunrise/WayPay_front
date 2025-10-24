import { useEffect, useRef, useCallback } from 'react';
import { BASE_URL } from '../client';
import { useAuth } from '../../сontext/AuthContext';

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
          
          onNotification(message);
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
  }, [onNotification, onError, authInfo?.employee?.id]);

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

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, disconnect, authInfo?.employee?.id]);

  return {
    disconnect,
    reconnect: connect
  };
};