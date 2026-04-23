import { useState, useCallback } from 'react';
import type { 
  ChannelStatusResponse, 
  DeleteMessageRequest, 
  MarkAsReadRequest, 
  QRResponse, 
  SendMessageRequest, 
  SendMessageResponse,
  FindChatByPhoneResponse,
  ChatHistoryResponse,
  ChatMessage,
  SendMediaFormRequest
} from '../types/whatsapp';
import whatsappService from '../services/whatsappService';

const useWhatsApp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(null);
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [channelStatus, setChannelStatus] = useState<ChannelStatusResponse | null>(null);
  
  const [foundChat, setFoundChat] = useState<FindChatByPhoneResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Отправка текстового сообщения
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<SendMessageResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      from: channelStatus?.phoneNumber || 'currentUser',
      to: request.to,
      chatId: foundChat?.chatId || '',
      chatName: foundChat?.clientName || request.to,
      fromName: 'Вы',
      timestamp: Math.floor(Date.now() / 1000),
      status: 'PENDING',
      isFromMe: true,
      source: 'web',
      deviceId: 0,
      type: 'text',
      subtype: '',
      displayText: request.body || '',
      text: {
        body: request.body || '',
        buttons: [],
        viewOnce: false
      },
      reactions: [],
      labels: []
    };
    
    addOptimisticMessage(optimisticMessage);
    
    try {
      const result = await whatsappService.sendMessage(request);
      setSendResult(result);
      
      if (result.success && result.messageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: result.messageId!, status: 'SENT' as const }
            : msg
        ));
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === result.messageId 
              ? { ...msg, status: 'DELIVERED' as const }
              : msg
          ));
        }, 1000);
        
      } else if (!result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'FAILED' as const, displayText: `[Ошибка] ${msg.displayText}` }
            : msg
        ));
      }
      
      return result;
    } catch (err) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'FAILED' as const, displayText: `[Ошибка] ${msg.displayText}` }
          : msg
      ));
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [channelStatus, foundChat, addOptimisticMessage]);

  // Отправка медиа сообщения через FormData (рекомендуется)
  const sendMediaMessage = useCallback(async (
    to: string,
    file: File,
    mediaKind: string,
    caption?: string
  ): Promise<SendMessageResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const displayText = caption || getMediaDisplayText(mediaKind, file.name);
    
    const optimisticMessage: ChatMessage = {
      id: tempId,
      from: channelStatus?.phoneNumber || 'currentUser',
      to: to,
      chatId: foundChat?.chatId || '',
      chatName: foundChat?.clientName || to,
      fromName: 'Вы',
      timestamp: Math.floor(Date.now() / 1000),
      status: 'PENDING',
      isFromMe: true,
      source: 'web',
      deviceId: 0,
      type: mediaKind,
      subtype: '',
      displayText: displayText,
      reactions: [],
      labels: []
    };
    
    // Добавляем соответствующий контент в зависимости от типа
    if (mediaKind === 'image') {
      optimisticMessage.image = {
        id: tempId,
        link: '',
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
        sha256: '',
        timestamp: Math.floor(Date.now() / 1000),
        caption: caption || '',
        preview: '',
        width: 0,
        height: 0,
        viewOnce: false,
        buttons: []
      };
    } else if (mediaKind === 'video') {
      optimisticMessage.video = {
        id: tempId,
        link: '',
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
        sha256: '',
        timestamp: Math.floor(Date.now() / 1000),
        caption: caption || '',
        preview: '',
        width: 0,
        height: 0,
        viewOnce: false,
        seconds: 0,
        autoplay: false,
        buttons: []
      };
    } else if (mediaKind === 'document') {
      optimisticMessage.document = {
        id: tempId,
        link: '',
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
        sha256: '',
        timestamp: Math.floor(Date.now() / 1000),
        caption: caption || '',
        preview: '',
        width: 0,
        height: 0,
        viewOnce: false,
        pageCount: 0,
        buttons: []
      };
    } else if (mediaKind === 'audio') {
      optimisticMessage.audio = {
        id: tempId,
        link: '',
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
        sha256: '',
        timestamp: Math.floor(Date.now() / 1000),
        seconds: 0,
        recordingTime: 0,
        waveform: '',
        viewOnce: false
      };
    } else if (mediaKind === 'voice') {
      optimisticMessage.voice = {
        id: tempId,
        link: '',
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
        sha256: '',
        timestamp: Math.floor(Date.now() / 1000),
        seconds: 0,
        recordingTime: 0,
        waveform: '',
        viewOnce: false
      };
    }
    
    addOptimisticMessage(optimisticMessage);
    
    try {
      const request: SendMediaFormRequest = {
        to,
        file,
        mediaKind,
        caption
      };
      
      const result = await whatsappService.sendMediaFormData(request);
      setSendResult(result);
      
      if (result.success && result.messageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: result.messageId!, status: 'SENT' as const }
            : msg
        ));
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === result.messageId 
              ? { ...msg, status: 'DELIVERED' as const }
              : msg
          ));
        }, 1000);
        
      } else if (!result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'FAILED' as const, displayText: `[Ошибка] ${msg.displayText}` }
            : msg
        ));
      }
      
      return result;
    } catch (err) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'FAILED' as const, displayText: `[Ошибка] ${msg.displayText}` }
          : msg
      ));
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [channelStatus, foundChat, addOptimisticMessage]);

  // Вспомогательная функция для отображения типа медиа
  const getMediaDisplayText = (mediaKind: string, fileName: string): string => {
    switch (mediaKind) {
      case 'image': return `📷 Изображение: ${fileName}`;
      case 'video': return `🎥 Видео: ${fileName}`;
      case 'document': return `📄 Документ: ${fileName}`;
      case 'audio': return `🎵 Аудио: ${fileName}`;
      case 'voice': return `🎙️ Голосовое сообщение`;
      default: return `📎 Файл: ${fileName}`;
    }
  };

  const markAsRead = useCallback(async (request: MarkAsReadRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await whatsappService.markAsRead(request);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMessage = useCallback(async (request: DeleteMessageRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await whatsappService.deleteMessage(request);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getQR = useCallback(async (userId: string): Promise<QRResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await whatsappService.getQR(userId);
      setQrData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getChannelStatus = useCallback(async (): Promise<ChannelStatusResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await whatsappService.getChannelStatus();
      setChannelStatus(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findChatByPhone = useCallback(async (clientPhone: string): Promise<FindChatByPhoneResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await whatsappService.findChatByPhone({ clientPhone });
      setFoundChat(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChatWithClient = useCallback(async (
      clientPhone: string, 
      limit: number = 50,
      offset: number = 0,
      append: boolean = false
    ): Promise<ChatHistoryResponse | null> => {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);
      
      try {
        const result = await whatsappService.getChatWithClient({ clientPhone, limit, offset });
        setChatHistory(result);
        
        setCanLoadMore(result.canLoadMore);
        setTotalMessages(result.totalCount);
        setCurrentOffset(offset + result.messages.length);
        
        const reversedMessages = [...result.messages].reverse();
        
        if (append) {
          setMessages(prev => [...reversedMessages, ...prev]);
        } else {
          setMessages(reversedMessages);
        }
        
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        if (!append) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
  }, []);

  const loadOlderMessages = useCallback(async (clientPhone: string): Promise<boolean> => {
    if (!canLoadMore || isLoadingMore) {
      return false;
    }
    
    const result = await loadChatWithClient(clientPhone, 50, currentOffset, true);
    return result?.canLoadMore ?? false;
  }, [canLoadMore, isLoadingMore, currentOffset, loadChatWithClient]);

  const clearChatData = useCallback(() => {
    setFoundChat(null);
    setChatHistory(null);
    setMessages([]);
    setCanLoadMore(false);
    setTotalMessages(0);
    setCurrentOffset(0);
  }, []);

  const clearResults = useCallback(() => {
    setSendResult(null);
    setQrData(null);
    setChannelStatus(null);
    clearChatData();
  }, [clearChatData]);

  return {
    isLoading,
    isLoadingMore,
    error,
    sendResult,
    qrData,
    channelStatus,
    foundChat,
    chatHistory,
    messages,
    
    canLoadMore,
    totalMessages,
    currentOffset,
    
    sendMessage,
    sendMediaMessage,
    markAsRead,
    deleteMessage,
    getQR,
    getChannelStatus,
    findChatByPhone,
    loadChatWithClient,
    loadOlderMessages,    
    clearChatData,
    clearResults
  };
};

export default useWhatsApp;