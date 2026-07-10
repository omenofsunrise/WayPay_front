import { useState, useCallback, useRef } from "react";
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
  SendMediaFormRequest,
  ChannelResponse,
  BotResponse,
  BotKeywordResponse,
  AddBotKeywordRequest,
  BotType,
  BotEventType,
  BotResponseTextType,
} from "../types/whatsapp";
import whatsappService from "../services/whatsappService";

const useWhatsApp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(
    null
  );
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [channelStatus, setChannelStatus] =
    useState<ChannelStatusResponse | null>(null);

  const [foundChat, setFoundChat] = useState<FindChatByPhoneResponse | null>(
    null
  );
  const [chatHistory, setChatHistory] = useState<ChatHistoryResponse | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [canLoadMore, setCanLoadMore] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelResponse | null>(null);

  const [bots, setBots] = useState<BotResponse[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotResponse | null>(null);
  const [botKeywords, setBotKeywords] = useState<
    Map<number, BotKeywordResponse[]>
  >(new Map());
  // Канал текущего открытого чата (для chat-with-client и догрузки истории).
  const currentChannelIdRef = useRef<string | undefined>(undefined);

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addIncomingMessage = useCallback(
    (fromPhone: string, body: string, timestampMs?: number) => {
      const ts = Math.floor((timestampMs ?? Date.now()) / 1000);
      const incoming: ChatMessage = {
        id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        from: fromPhone,
        to: channelStatus?.phoneNumber || "",
        chatId: "",
        chatName: "",
        fromName: "",
        timestamp: ts,
        status: "DELIVERED",
        isFromMe: false,
        source: "whatsapp",
        deviceId: 0,
        type: "text",
        subtype: "",
        displayText: body,
        text: {
          body,
          buttons: [],
          viewOnce: false,
        },
        reactions: [],
        labels: [],
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    },
    [channelStatus]
  );

  const getChannels = useCallback(async (): Promise<
    ChannelResponse[] | null
  > => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await whatsappService.getChannels();
      setChannels(result.chanelResponses);
      return result.chanelResponses;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChannel = useCallback(
    async (
      name: string,
      employeeIds: number[]
    ): Promise<ChannelResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newChannel = await whatsappService.createChannel(
          name,
          employeeIds
        );
        setChannels((prev) => [...prev, newChannel]);
        return newChannel;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteChannel = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.deleteChannel(id);
        setChannels((prev) => prev.filter((channel) => channel.id !== id));
        if (selectedChannel?.id === id) {
          setSelectedChannel(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChannel]
  );

  const setChannelEmployees = useCallback(
    async (channelId: string, employeeIds: number[]): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.setChannelEmployees(channelId, employeeIds);

        setChannels((prev) =>
          prev.map((channel) =>
            channel.id === channelId
              ? { ...channel, employeeIds: employeeIds }
              : channel
          )
        );

        if (selectedChannel?.id === channelId) {
          setSelectedChannel((prev) =>
            prev ? { ...prev, employeeIds: employeeIds } : null
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChannel]
  );

  const sendMessage = useCallback(
    async (
      request: SendMessageRequest
    ): Promise<SendMessageResponse | null> => {
      setIsLoading(true);
      setError(null);

      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        from: channelStatus?.phoneNumber || "currentUser",
        to: request.to,
        chatId: foundChat?.chatId || "",
        chatName: foundChat?.clientName || request.to,
        fromName: "Вы",
        timestamp: Math.floor(Date.now() / 1000),
        status: "PENDING",
        isFromMe: true,
        source: "web",
        deviceId: 0,
        type: "text",
        subtype: "",
        displayText: request.body || "",
        text: {
          body: request.body || "",
          buttons: [],
          viewOnce: false,
        },
        reactions: [],
        labels: [],
      };

      addOptimisticMessage(optimisticMessage);

      try {
        const result = await whatsappService.sendMessage(request);
        setSendResult(result);

        if (result.success && result.messageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: result.messageId!, status: "SENT" as const }
                : msg
            )
          );

          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === result.messageId
                  ? { ...msg, status: "DELIVERED" as const }
                  : msg
              )
            );
          }, 1000);
        } else if (!result.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? {
                    ...msg,
                    status: "FAILED" as const,
                    displayText: `[Ошибка] ${msg.displayText}`,
                  }
                : msg
            )
          );
        }

        return result;
      } catch (err) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  status: "FAILED" as const,
                  displayText: `[Ошибка] ${msg.displayText}`,
                }
              : msg
          )
        );
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [channelStatus, foundChat, addOptimisticMessage]
  );

  const sendMediaMessage = useCallback(
    async (
      to: string,
      file: File,
      mediaKind: string,
      caption?: string
    ): Promise<SendMessageResponse | null> => {
      setIsLoading(true);
      setError(null);

      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const displayText = caption || getMediaDisplayText(mediaKind, file.name);
      const localUrl = URL.createObjectURL(file);

      const optimisticMessage: ChatMessage = {
        id: tempId,
        from: channelStatus?.phoneNumber || "currentUser",
        to: to,
        chatId: foundChat?.chatId || "",
        chatName: foundChat?.clientName || to,
        fromName: "Вы",
        timestamp: Math.floor(Date.now() / 1000),
        status: "PENDING",
        isFromMe: true,
        source: "web",
        deviceId: 0,
        type: mediaKind,
        subtype: "",
        displayText: displayText,
        reactions: [],
        labels: [],
      };

      // For optimistic media: use a local blob URL as `link` and leave `id` empty so
      // the loader does NOT try to GET /WhatsApp/media-by-id with a temp id (which 400s).
      if (mediaKind === "image") {
        optimisticMessage.image = {
          id: "",
          link: localUrl,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
          sha256: "",
          timestamp: Math.floor(Date.now() / 1000),
          caption: caption || "",
          preview: "",
          width: 0,
          height: 0,
          viewOnce: false,
          buttons: [],
        };
      } else if (mediaKind === "video") {
        optimisticMessage.video = {
          id: "",
          link: localUrl,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
          sha256: "",
          timestamp: Math.floor(Date.now() / 1000),
          caption: caption || "",
          preview: "",
          width: 0,
          height: 0,
          viewOnce: false,
          seconds: 0,
          autoplay: false,
          buttons: [],
        };
      } else if (mediaKind === "document") {
        optimisticMessage.document = {
          id: "",
          link: localUrl,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
          sha256: "",
          timestamp: Math.floor(Date.now() / 1000),
          caption: caption || "",
          preview: "",
          width: 0,
          height: 0,
          viewOnce: false,
          pageCount: 0,
          buttons: [],
        };
      } else if (mediaKind === "audio") {
        optimisticMessage.audio = {
          id: "",
          link: localUrl,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
          sha256: "",
          timestamp: Math.floor(Date.now() / 1000),
          seconds: 0,
          recordingTime: 0,
          waveform: "",
          viewOnce: false,
        };
      } else if (mediaKind === "voice") {
        optimisticMessage.voice = {
          id: "",
          link: localUrl,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
          sha256: "",
          timestamp: Math.floor(Date.now() / 1000),
          seconds: 0,
          recordingTime: 0,
          waveform: "",
          viewOnce: false,
        };
      }

      addOptimisticMessage(optimisticMessage);

      try {
        const request: SendMediaFormRequest = {
          to,
          file,
          mediaKind,
          caption,
        };

        const result = await whatsappService.sendMediaFormData(request);
        setSendResult(result);

        if (result.success && result.messageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: result.messageId!, status: "SENT" as const }
                : msg
            )
          );

          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === result.messageId
                  ? { ...msg, status: "DELIVERED" as const }
                  : msg
              )
            );
          }, 1000);
        } else if (!result.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? {
                    ...msg,
                    status: "FAILED" as const,
                    displayText: `[Ошибка] ${msg.displayText}`,
                  }
                : msg
            )
          );
        }

        return result;
      } catch (err) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  status: "FAILED" as const,
                  displayText: `[Ошибка] ${msg.displayText}`,
                }
              : msg
          )
        );
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [channelStatus, foundChat, addOptimisticMessage]
  );

  const getMediaDisplayText = (mediaKind: string, fileName: string): string => {
    switch (mediaKind) {
      case "image":
        return `📷 Изображение: ${fileName}`;
      case "video":
        return `🎥 Видео: ${fileName}`;
      case "document":
        return `📄 Документ: ${fileName}`;
      case "audio":
        return `🎵 Аудио: ${fileName}`;
      case "voice":
        return `🎙️ Голосовое сообщение`;
      default:
        return `📎 Файл: ${fileName}`;
    }
  };

  const markAsRead = useCallback(
    async (request: MarkAsReadRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.markAsRead(request);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (request: DeleteMessageRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.deleteMessage(request);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getQR = useCallback(
    async (channelId: string): Promise<QRResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await whatsappService.getQR(channelId);
        setQrData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(
    async (channelId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.logout(channelId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChannel]
  );

  const getChannelStatus =
    useCallback(async (): Promise<ChannelStatusResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await whatsappService.getChannelStatus();
        setChannelStatus(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    }, []);

  const findChatByPhone = useCallback(
    async (clientPhone: string): Promise<FindChatByPhoneResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await whatsappService.findChatByPhone({ clientPhone });
        setFoundChat(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const extendChannel = useCallback(
    async (days: number, channelId: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const paymentUrl = await whatsappService.extendChannel(days, channelId);
        return paymentUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadChatWithClient = useCallback(
    async (
      clientPhone: string,
      limit: number = 50,
      offset: number = 0,
      append: boolean = false,
      channelId?: string
    ): Promise<ChatHistoryResponse | null> => {
      if (!append) {
        setIsLoading(true);
        // Запоминаем канал, чтобы догрузка старых сообщений шла по тому же каналу.
        currentChannelIdRef.current = channelId;
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const result = await whatsappService.getChatWithClient({
          clientPhone,
          limit,
          offset,
          channelId: currentChannelIdRef.current,
        });
        setChatHistory(result);

        setCanLoadMore(result.canLoadMore);
        setTotalMessages(result.totalCount);
        setCurrentOffset(offset + result.messages.length);

        const reversedMessages = [...result.messages].reverse();

        if (append) {
          setMessages((prev) => [...reversedMessages, ...prev]);
        } else {
          setMessages(reversedMessages);
        }

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        if (!append) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    []
  );

  const loadOlderMessages = useCallback(
    async (clientPhone: string): Promise<boolean> => {
      if (!canLoadMore || isLoadingMore) {
        return false;
      }

      const result = await loadChatWithClient(
        clientPhone,
        50,
        currentOffset,
        true
      );
      return result?.canLoadMore ?? false;
    },
    [canLoadMore, isLoadingMore, currentOffset, loadChatWithClient]
  );

  const setCurrentChannel = useCallback(
    async (channelId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.setCurrentChannel(channelId);

        const channel = channels.find((c) => c.id === channelId);
        if (channel) {
          setSelectedChannel(channel);
        }

        await getChannelStatus();

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [channels, getChannelStatus]
  );

  const createBot = useCallback(
    async (
      channelId: string,
      name: string,
      botType: BotType
    ): Promise<BotResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newBot = await whatsappService.createBot(
          channelId,
          name,
          botType
        );
        setBots((prev) => [...prev, newBot]);
        return newBot;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateBot = useCallback(
    async (
      name: string,
      id: number,
      active: boolean
    ): Promise<BotResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedBot = await whatsappService.updateBot(name, id, active);
        setBots((prev) =>
          prev.map((bot) => (bot.id === id ? updatedBot : bot))
        );
        if (selectedBot?.id === id) {
          setSelectedBot(updatedBot);
        }
        return updatedBot;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBot]
  );

  const deleteBot = useCallback(
    async (id: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.deleteBot(id);
        setBots((prev) => prev.filter((bot) => bot.id !== id));
        if (selectedBot?.id === id) {
          setSelectedBot(null);
        }
        // Also remove keywords for this bot
        setBotKeywords((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBot]
  );

  const setBotResponse = useCallback(
    async (
      botId: number,
      response: string,
      type?: BotResponseTextType
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.setBotResponse(botId, response, type);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setBotEvent = useCallback(
    async (botId: number, eventType: BotEventType): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.setBotEvent(botId, eventType);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addBotKeyword = useCallback(
    async (
      botId: number,
      matchType: AddBotKeywordRequest["type"],
      keyword: string
    ): Promise<BotKeywordResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newKeyword = await whatsappService.addBotKeyword(
          botId,
          matchType,
          keyword
        );

        // Update local keywords cache
        setBotKeywords((prev) => {
          const newMap = new Map(prev);
          const existingKeywords = newMap.get(botId) || [];
          newMap.set(botId, [...existingKeywords, newKeyword]);
          return newMap;
        });

        return newKeyword;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteBotKeyword = useCallback(
    async (id: number, botId: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await whatsappService.deleteBotKeyword(id);

        // Update local keywords cache
        setBotKeywords((prev) => {
          const newMap = new Map(prev);
          const existingKeywords = newMap.get(botId) || [];
          newMap.set(
            botId,
            existingKeywords.filter((kw) => kw.id !== id)
          );
          return newMap;
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadBotsByChannel = useCallback(
    async (channelId: string): Promise<BotResponse[] | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const botsList = await whatsappService.getBotsByChannel(channelId);
        setBots(botsList);
        return botsList;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
    addIncomingMessage,
    markAsRead,
    deleteMessage,
    getQR,
    getChannelStatus,
    findChatByPhone,
    loadChatWithClient,
    loadOlderMessages,
    clearChatData,
    clearResults,
    channels,
    selectedChannel,
    getChannels,
    createChannel,
    deleteChannel,
    setCurrentChannel,
    setChannelEmployees,
    extendChannel,
    logout,
    bots,
    selectedBot,
    createBot,
    updateBot,
    deleteBot,
    setBotResponse,
    setBotEvent,
    addBotKeyword,
    deleteBotKeyword,
    loadBotsByChannel,
    setSelectedBot,
  };
};

export default useWhatsApp;
