import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import type { ChatMessage, SendMessageRequest } from '../api/types/whatsapp';
import useWhatsApp from '../api/hooks/useWhatsApp';
import MessageContent from './MessageContent';

interface WhatsAppChatProps {
  phoneNumber: string;
  clientName?: string;
  height?: string | number;
  width?: string | number;
  showHeader?: boolean;
  className?: string;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  phoneNumber,
  clientName,
  height = '600px',
  width = '100%',
  showHeader = true,
  className
}) => {
  const {
    isLoading,
    error,
    messages,
    foundChat,
    channelStatus,
    sendMessage,
    sendMediaMessage,
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
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Инициализация чата при изменении phoneNumber
  useEffect(() => {
    initializeChat();
    
    // Очистка при размонтировании
    return () => {
      clearChatData();
    };
  }, [phoneNumber]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatExists && !isLoading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatExists, isLoading]);
  
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowAttachmentMenu(false);

    try {
      let mediaKind = 'document';
      if (file.type.startsWith('image/')) {
        mediaKind = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaKind = 'video';
      } else if (file.type.startsWith('audio/')) {
        if (file.type.includes('ogg') || file.size < 1024 * 1024) {
          mediaKind = 'voice';
        } else {
          mediaKind = 'audio';
        }
      }

      const result = await sendMediaMessage(
        cleanPhoneNumber,
        file,
        mediaKind,
        `📎 ${file.name}`
      );

      if (!result?.success) {
        alert('Ошибка при отправке файла: ' + (result?.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Ошибка при отправке файла');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setIsUploading(true);
          try {
            const result = await sendMediaMessage(
              cleanPhoneNumber,
              file,
              'image',
              '📷 Изображение из буфера обмена'
            );
            if (!result?.success) {
              alert('Ошибка при отправке изображения');
            }
          } finally {
            setIsUploading(false);
          }
        }
        break;
      }
    }
  }, [cleanPhoneNumber, sendMediaMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      case 'PENDING':
        return <span style={{ color: '#8696A0' }}>⏱️</span>;
      default:
        return null;
    }
  };

  const getConnectionStatusText = () => {
    return `WhatsApp • ${channelStatus?.name || channelStatus?.phoneNumber || 'Подключение...'}`;
  };

  const getConnectionStatusColor = () => {
    return channelStatus?.connected ? '#25D366' : '#FFA500';
  };

  const isConnected = channelStatus?.name ?? false;

  const showLoading = isInitializing || (isLoading && messages.length === 0);
  const showEmptyState = !showLoading && messages.length === 0 && chatExists;
  const showNoChatState = !showLoading && !chatExists && !isInitializing;

  return (
    <Container className={className} style={{ width, height }}>
      {/* Header */}
      {showHeader && (
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
        </ChatHeader>
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
              <SendFirstMessageButton onClick={handleSendMessage}>
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
        <AttachmentButton
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          disabled={!isConnected || isLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" fill="#075E54"/>
          </svg>
        </AttachmentButton>

        {showAttachmentMenu && (
          <AttachmentMenu>
            <AttachmentMenuItem onClick={() => fileInputRef.current?.click()}>
              <span>📷</span> Фото/Видео
            </AttachmentMenuItem>
            <AttachmentMenuItem onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt';
                fileInputRef.current.click();
              }
            }}>
              <span>📄</span> Документ
            </AttachmentMenuItem>
            <AttachmentMenuItem onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'audio/*';
                fileInputRef.current.click();
              }
            }}>
              <span>🎵</span> Аудио
            </AttachmentMenuItem>
          </AttachmentMenu>
        )}

        <MessageInput
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder={
            !isConnected 
              ? "Подключите WhatsApp для отправки сообщений"
              : !chatExists
              ? "Номер не в WhatsApp, но можно отправить сообщение"
              : isUploading
              ? "Отправка файла..."
              : "Введите сообщение..."
          }
          disabled={!isConnected || isLoading || isUploading}
        />
        
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt"
        />

        {(newMessage.trim() || isUploading) ? (
          <SendButton 
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !isUploading) || !isConnected || isLoading || isUploading}
          >
            {isUploading ? (
              <Spinner size="small" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="#fff"/>
              </svg>
            )}
          </SendButton>
        ) : (
          <VoiceButton disabled={!isConnected || isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H6c0 3.66 2.95 6.68 6.5 7.16V21h-2v2h6v-2h-2v-2.84c3.55-.48 6.5-3.5 6.5-7.16h-2z" fill="#075E54"/>
            </svg>
          </VoiceButton>
        )}
      </InputArea>
    </Container>
  );
};

// Обновленные стили
const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ChatHeader = styled.div`
  background-color: #075E54;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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
  position: relative;
  flex-shrink: 0;
`;

const AttachmentButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AttachmentMenu = styled.div`
  position: absolute;
  bottom: 60px;
  left: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 10;
`;

const AttachmentMenuItem = styled.div`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  span {
    font-size: 20px;
  }
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

const VoiceButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

export default WhatsAppChat;