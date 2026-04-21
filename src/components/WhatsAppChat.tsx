import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import type { ChatMessage, SendMessageRequest } from '../api/types/whatsapp';
import useWhatsApp from '../api/hooks/useWhatsApp';
import MessageContent from './MessageContent';

interface WhatsAppChatProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  clientName?: string;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  clientName
}) => {
  const {
    isLoading,
    error,
    messages,
    foundChat,
    channelStatus,
    sendMessage,
    findChatByPhone,
    loadChatWithClient,
    getChannelStatus,
    clearChatData,
    isLoadingMore,
    canLoadMore,
    loadOlderMessages
  } = useWhatsApp();

  const [newMessage, setNewMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  const formatPhoneForDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    }
    if (digits.length === 10) {
      return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }
    return `+${digits}`;
  };

  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  const displayPhoneNumber = formatPhoneForDisplay(phoneNumber);
  const chatExists = foundChat?.exists ?? false;
  const displayName = clientName || foundChat?.clientName || displayPhoneNumber;

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    } else {
      clearChatData();
    }
  }, [isOpen, phoneNumber]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && chatExists && !isLoading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, chatExists, isLoading]);
  
  const initializeChat = async () => {
    setIsInitializing(true);
    try {
      await getChannelStatus();
      
      const chat = await findChatByPhone(cleanPhoneNumber);
      
      if (chat?.exists) {
        await loadChatWithClient(cleanPhoneNumber, 12, 0, false);
      }
    } catch (err) {
      console.error('Failed to initialize chat:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearTop = target.scrollTop < 100;
    
    if (isNearTop && !isLoadingMore && canLoadMore && !isScrollingUp) {
      setIsScrollingUp(true);
      
      const previousScrollHeight = target.scrollHeight;
      const previousScrollTop = target.scrollTop;
      
      await loadOlderMessages(cleanPhoneNumber);
      
      requestAnimationFrame(() => {
        const newScrollHeight = target.scrollHeight;
        const addedHeight = newScrollHeight - previousScrollHeight;
        target.scrollTop = previousScrollTop + addedHeight;
        setIsScrollingUp(false);
      });
    }
  }, [isLoadingMore, canLoadMore, loadOlderMessages, cleanPhoneNumber, isScrollingUp]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const result = await sendMessage({
      to: cleanPhoneNumber,
      body: newMessage.trim()
    });
    
    if (result?.success) {
      setNewMessage('');
      inputRef.current?.focus();
    } else {
      alert('Ошибка при отправке сообщения: ' + (result?.error || 'Неизвестная ошибка'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    const msgDate = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return msgDate.toLocaleDateString('ru-RU');
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};
    messages.forEach(message => {
      const dateKey = formatDate(message.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  };

  const getStatusIcon = (status: string, isFromMe: boolean) => {
    if (!isFromMe) return null;
    
    switch (status) {
      case 'FAILED':
        return <span style={{ color: '#ff4444' }}>⚠️</span>;
      default:
        return null;
    }
  };

  const getConnectionStatusText = () => {
    return channelStatus?.name ? `Подключено ${channelStatus.name}` : `Подключение...`;
  };

  const getConnectionStatusColor = () => {
    return channelStatus?.name ? '#25D366' : 'FFA500';
  };

  const isConnected = channelStatus?.name !== 'CONNECTED';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showLoading = isInitializing || (isLoading && messages.length === 0);
  const showEmptyState = !showLoading && messages.length === 0 && chatExists;
  const showNoChatState = !showLoading && !chatExists && !isInitializing;

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        {/* Header */}
        <ChatHeader>
          <HeaderInfo>
            <Avatar>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#fff"/>
              </svg>
            </Avatar>
            <HeaderText>
              <ClientName>{displayName}</ClientName>
              <StatusIndicator color={getConnectionStatusColor()}>
                {getConnectionStatusText()}
              </StatusIndicator>
            </HeaderText>
          </HeaderInfo>
          <CloseButton onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#fff"/>
            </svg>
          </CloseButton>
        </ChatHeader>

        {/* Connection Status Bar */}
        {!isConnected && (
          <ConnectionWarning>
            <WarningIcon>⚠️</WarningIcon>
            <WarningText>
              {channelStatus?.status === 'AWAITING_SCAN' && 'Требуется сканирование QR-кода для подключения к WhatsApp'}
              {channelStatus?.status === 'CONNECTING' && 'Подключение к WhatsApp...'}
              {channelStatus?.status === 'EXPIRED' && 'Сессия WhatsApp истекла. Пожалуйста, переподключитесь.'}
              {channelStatus?.status === 'DISCONNECTED' && 'WhatsApp аккаунт не подключен. Пожалуйста, подключите аккаунт в настройках.'}
              {!channelStatus?.status && 'Проверка подключения...'}
            </WarningText>
            <RetryButton onClick={initializeChat}>Проверить</RetryButton>
          </ConnectionWarning>
        )}

        {/* Messages Area */}
        <MessagesArea ref={messagesContainerRef} onScroll={handleScroll}>
          {isLoadingMore && (
            <LoadingOlderIndicator>
              <Spinner size="small" />
              <span>Загрузка старых сообщений...</span>
            </LoadingOlderIndicator>
          )}

          {showEmptyState && (
            <EmptyState>
              <EmptyIcon>💬</EmptyIcon>
              <EmptyText>Нет сообщений</EmptyText>
              <EmptySubtext>Напишите первое сообщение</EmptySubtext>
            </EmptyState>
          )}

          {showNoChatState && (
            <EmptyState>
              <EmptyIcon>📱</EmptyIcon>
              <EmptyText>Клиент не в WhatsApp</EmptyText>
              <EmptySubtext>
                Номер {displayPhoneNumber} не зарегистрирован в WhatsApp
              </EmptySubtext>
              {isConnected && (
                <SendFirstMessageButton onClick={() => {
                  // Автоматически отправить приветственное сообщение
                  handleSendMessage();
                }}>
                  Отправить первое сообщение
                </SendFirstMessageButton>
              )}
            </EmptyState>
          )}

          {!showLoading && !showEmptyState && !showNoChatState && messages.length > 0 && (
            <>
              {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
                <React.Fragment key={date}>
                  <DateDivider>
                    <DateDividerText>{date}</DateDividerText>
                  </DateDivider>
                  {dateMessages.map((message) => (
                    <MessageBubble key={message.id} isOwn={message.isFromMe}>
                      <MessageContent message={message} />
                      <MessageMeta>
                        <MessageTime>{formatTime(message.timestamp)}</MessageTime>
                        {getStatusIcon(message.status, message.isFromMe)}
                      </MessageMeta>
                    </MessageBubble>
                  ))}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
          {canLoadMore && !isLoadingMore && messages.length > 0 && (
            <LoadMoreButton onClick={() => loadOlderMessages(cleanPhoneNumber)}>
              Загрузить предыдущие сообщения
            </LoadMoreButton>
          )}
        </MessagesArea>

        {/* Input Area */}
        <InputArea>
          <MessageInput
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !isConnected 
                ? "Подключите WhatsApp для отправки сообщений"
                : !chatExists
                ? "Номер не в WhatsApp, но можно отправить сообщение"
                : "Введите сообщение..."
            }
            disabled={!isConnected || isLoading}
          />
          <SendButton 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="#fff"/>
            </svg>
          </SendButton>
        </InputArea>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width: 450px;
  height: 650px;
  background-color: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
`;

const ChatHeader = styled.div`
  background-color: #075E54;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  background-color: #128C7E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
`;

const ClientName = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const StatusIndicator = styled.div<{ color: string }>`
  font-size: 12px;
  opacity: 0.8;
  color: ${props => props.color};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ConnectionWarning = styled.div`
  background-color: #fff3cd;
  border-bottom: 1px solid #ffeeba;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WarningIcon = styled.span`
  font-size: 20px;
`;

const WarningText = styled.div`
  flex: 1;
  font-size: 12px;
  color: #856404;
`;

const RetryButton = styled.button`
  background-color: #856404;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: #6b4c02;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #ECE5DD;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DateDivider = styled.div`
  text-align: center;
  margin: 16px 0;
`;

const DateDividerText = styled.span`
  background-color: rgba(0, 0, 0, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
`;

const MessageBubble = styled.div<{ isOwn: boolean }>`
  max-width: 70%;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isOwn ? '#DCF8C6' : '#fff'};
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
  margin-bottom: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: #8696A0;
`;

const MessageTime = styled.span`
  font-size: 10px;
`;

const InputArea = styled.div`
  padding: 12px 16px;
  background-color: #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: center;
  border-top: 1px solid #ddd;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  
  &:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background-color: #075E54;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: #128C7E;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #666;
`;

const Spinner = styled.div<{ size?: 'small' | 'normal' }>`
  width: ${props => props.size === 'small' ? '20px' : '40px'};
  height: ${props => props.size === 'small' ? '20px' : '40px'};
  border: ${props => props.size === 'small' ? '2px' : '3px'} solid #f3f3f3;
  border-top: ${props => props.size === 'small' ? '2px' : '3px'} solid #075E54;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
`;

const EmptyText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #666;
`;

const EmptySubtext = styled.div`
  font-size: 12px;
  color: #999;
`;

const SendFirstMessageButton = styled.button`
  margin-top: 16px;
  padding: 8px 20px;
  background-color: #075E54;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #128C7E;
  }
`;

const LoadingOlderIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  color: #666;
  font-size: 12px;
`;

const LoadMoreButton = styled.button`
  margin: 16px auto;
  padding: 8px 16px;
  background-color: #075E54;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  display: block;
  
  &:hover {
    background-color: #128C7E;
  }
`;

const MessagesInfo = styled.div`
  text-align: center;
  font-size: 11px;
  color: #8696A0;
  padding: 8px;
  margin-top: 8px;
`;

export default WhatsAppChat;