import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Divider, 
  Box, 
  ListItemButton,
  IconButton,
  Avatar,
  ListItemAvatar,
  Chip,
} from '@mui/material';
import useChat from '../api/hooks/useChat';
import type { Chat, Message } from '../api/types/chat';
import { format } from 'date-fns';
import { useEmployee } from '../api/hooks/useEmployee';
import { getInitials, generateAvatar } from '../utils/avatarUtils';
import CloseIcon from '@mui/icons-material/Close';
import styled from "styled-components";
import DeleteIcon from '@mui/icons-material/Delete';
import ChatSide from '../components/Chat/ChatSide';
import SearchField from '../components/Chat/SearchField';
import MessageInput from '../components/Chat/MessageInput';
import { useSignalR } from '../api/hooks/useSignalR';
import { useNavigate, useParams } from 'react-router-dom';
import useBlog from '../api/hooks/useBlog';
import type { BlogPost } from '../api/types/blog';
import MessageItem from '../components/Chat/MessageItem';
import { FILE_BASE_URL } from '../api/client';
import MessageContextMenu from '../components/ui/contextMenus/MessageContextMenu';
import SelectCreditModal from '../components/modal/CrudInherited/SelectCreditModal';
import CreateNoteModal from '../components/modal/CreateNoteModal';
import useNotes from '../api/hooks/useNote';
import { NOTEABLE_TYPES } from '../api/types/note';
import { SOCIAL_BASE_URL } from '../api/socialApiClient';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu = ({ x, y, onClose, children }: ContextMenuProps) => {
  return (
    <>
      <Backdrop onClick={onClose} />
      <MenuContainer style={{ left: x, top: y }}>
        {children}
      </MenuContainer>
    </>
  );
};

const MenuItem = styled.div<{ danger?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${props => props.danger ? '#ff4d4f' : '#333'};
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  svg {
    font-size: 16px;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

const MenuContainer = styled.div`
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 160px;
  padding: 4px 0;
`;

const ChatContainer = styled.div`
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
`;

const ChatListContainer = styled.div`
  width: 350px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
`;

const ChatContentContainer = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9f9f9;
`;

const EmptyChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
`;

const ChatPage = () => {
  const {
    chats,
    messages,
    currentChat,
    error,
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
    fetchChatMembers,
    markMessagesAsRead,
    createPrivateChat,
    deleteChat
  } = useChat();
    const {
    createNote
  } = useNotes();
  const { getPostById } = useBlog();
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [localMessageSearch, setLocalMessageSearch] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);
  const [chatContextMenu, setChatContextMenu] = useState<{
    chat: Chat;
    x: number;
    y: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authInfo } = useEmployee();
  const currentUser = authInfo?.employee;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSideOpen, setIsSideOpen] = useState(false);
  const { connection } = useSignalR();
  const [typingUsers, setTypingUsers] = useState<{id: number, name: string}[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const { postId } = useParams<{ postId?: string }>();
  const [messagePost, setMessagePost] = useState<BlogPost | null>(null);
  const [loadingMessagePost, setLoadingMessagePost] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null);  
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isSelectCreditModalOpen, setIsSelectCreditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const currentChatFromUrl = useMemo(() => {
    return chatId ? chats.find(c => c.id.toString() === chatId) : null;
  }, [chatId, chats]);

  useEffect(() => {
    if (messageContextMenu?.message.postId) {
      loadMessagePost(messageContextMenu.message.postId);
    }
  }, [messageContextMenu?.message.postId]);

  useEffect(() => {
    if (postId) {
      const loadPost = async () => {
        try {
          setLoadingPost(true);
          const postData = await getPostById(Number(postId));
          setPost(postData);
        } catch (error) {
          console.error('Failed to load post:', error);
        } finally {
          setLoadingPost(false);
        }
      };
      
      loadPost();
    } else {
      setPost(null);
    }
  }, [postId, getPostById]);

  useEffect(() => {
    if (chatId) {
      const chat = chats.find(c => c.id.toString() === chatId);
      if (chat && (!currentChat || currentChat.id !== chat.id)) {
        selectChat(chat);
      }
    } else if (currentChat) {
    }
  }, [chatId, chats, currentChat, selectChat]);

  useEffect(() => {
    if (!connection) return;

    connection.on('ReceiveMessage', (newMessage: Message) => {
      if (currentChat?.id === newMessage.chatId) {
        fetchChatMessages(currentChat.id);
      }
      fetchUserChats();
    });

    connection.on('UserTyping', (chatId: number, userId: number, userName: string) => {
      if (currentChat?.id === chatId) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.id === userId);
          if (existing) return prev;
          return [...prev, {id: userId, name: userName}];
        });
        
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.id !== userId));
        }, 3000);
      }
    });

    return () => {
      connection.off('ReceiveMessage');
      connection.off('UserTyping');
    };
  }, [connection, currentChat, fetchChatMessages, fetchUserChats]);
  
  useEffect(() => {
    return () => {
      previewAttachments.forEach(({url}) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewAttachments]);

  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  useEffect(() => {
    if (currentChat) {
      fetchChatMembers(currentChat.id);
      fetchChatMessages(currentChat.id);
    }
  }, [currentChat, fetchChatMembers, fetchChatMessages]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, currentChat]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAttachments(e.target.files);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessagePost = useCallback(async (postId: number) => {
    try {
      setLoadingMessagePost(true);
      const postData = await getPostById(postId);
      setMessagePost(postData);
    } catch (error) {
      console.error('Failed to load post:', error);
      setMessagePost(null);
    } finally {
      setLoadingMessagePost(false);
    }
  }, [getPostById]);

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    
    const senderName = chat.lastMessage.sender.fullName.split(' ')[0];
    
    if (chat.lastMessage.text === null || chat.lastMessage.attachments.length > 0) {
        return `${senderName}: файл`;
    }
    
    return `${senderName}: ${chat.lastMessage.text.substring(0, 30)}${chat.lastMessage.text.length > 30 ? '...' : ''}`;
  };

  const handleSelectChat = useCallback((chat: Chat | null) => {
    if (chat) {
      navigate(`/chat/${chat.id}`);
    } else {
      navigate('/chat');
    }
    selectChat(chat);
  }, [navigate, selectChat]);

  const handleOpenSide = () => {
    setIsSideOpen(true);
  };

  const handleCloseSide = () => {
    setIsSideOpen(false);
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'general') {
      return '/WayPay.png';
    }
    
    if (chat.avatarPath) {
      return FILE_BASE_URL + chat.avatarPath;
    }
    
    return generateAvatar(getInitials(chat.name));
  };

  const handleOpenUserChat = async (userId: number) => {
    const newChat = await createPrivateChat(userId);
    await fetchUserChats();
    window.open(`/chat/${newChat.id}`, '_blank');
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !currentChat) return;
    
    try {
      if (editingMessage) {
        await editMessage(currentChat.id, editingMessage.id, messageText);
        setEditingMessage(null);
      } else {
        await sendMessage(currentChat.id, { 
          text: messageText,
          attachments 
        });
        
        await markMessagesAsRead(currentChat.id);
      }
      
      setMessageText('');
      setAttachments([]);
      setPreviewAttachments([]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const notifyTyping = useCallback(() => {
    if (!connection || !currentChat || !currentUser) return;
    
    try {
      connection.invoke('NotifyTyping', currentChat.id, currentUser.id, currentUser.fullName);
    } catch (e) {
      console.error('Error notifying typing:', e);
    }
  }, [connection, currentChat, currentUser]);
  
  const lastTypingTimeRef = useRef<number>(0);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 3000) {
      notifyTyping();
      lastTypingTimeRef.current = now;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageDate = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const handleMessageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalMessageSearch(value);
    searchMessages(value);
  };

  const handleMessageSearchSubmit = () => {
    searchMessages(localMessageSearch);
  };

  const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    
    setSelectedMessage(message);
    setContextMenu({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
    });
  };

  const handleChatRightClick = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    if (chat.type === 'general' || chat.type === 'company') return;
    
    setChatContextMenu({
      chat,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMessageTouchStart = (message: Message) => {
    if (message.sender.id !== currentUser?.id) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessage(message);
      setContextMenu({
        mouseX: 100,
        mouseY: 100,
      });
    }, 500);
  };

  const handleMessageTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setMessageText(message.text || '');
    setMessageContextMenu(null);
    setContextMenu(null);
    scrollToBottom();
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!currentChat) return;
    try {
      await deleteMessage(currentChat.id, message.id);
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setMessageContextMenu(null);
      setContextMenu(null);
    }
  };

  const handleDeleteChat = async (chat: Chat) => {
    try {
      const isConfirmed = window.confirm('Вы действительно хотите удалить этот чат?');
      
      if (!isConfirmed) {
        setChatContextMenu(null);
        return;
      }

      await deleteChat(chat.id);
      await fetchUserChats();
      
      if (currentChat?.id === chat.id) {
        handleSelectChat(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    } finally {
      setChatContextMenu(null);
    }
  };

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
    setSelectedMessage(null);
  }, []);

  const handleMakeNote = useCallback(() => {
    if (selectedMessage && currentChat?.type === 'employee_client') {
      const hasFile = selectedMessage.attachments && selectedMessage.attachments.length > 0;
      console.log("asd");
      if (hasFile) {
        const attachment = selectedMessage.attachments[0];
        fetch(`${SOCIAL_BASE_URL}/${attachment.fileUrl}`)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], attachment.fileName, { 
              type: attachment.contentType
            });
            
            setNoteContent(selectedMessage.text || `Файл: ${attachment.fileName}`);
            setSelectedFile(file);
            setIsSelectCreditModalOpen(true);
          })
          .catch(error => {
            console.error('Ошибка загрузки файла:', error);
            setNoteContent(selectedMessage.text || '');
            setSelectedFile(null);
            setIsSelectCreditModalOpen(true);
          });
      } else {
        setNoteContent(selectedMessage.text || '');
        setSelectedFile(null);
        setIsSelectCreditModalOpen(true);
      }
    }
  }, [selectedMessage, currentChat?.type]);

  const handleCopy = useCallback(() => {
    if (selectedMessage?.text) {
      navigator.clipboard.writeText(selectedMessage.text);
    }
    setContextMenu(null);
  }, [selectedMessage]);

  const handleDelete = useCallback(() => {
    if (selectedMessage) {
      handleDeleteMessage(selectedMessage);
    }
  }, [selectedMessage]);

  const handleCreditSelect = useCallback((creditId: number) => {
    setSelectedCreditId(creditId);
    setIsSelectCreditModalOpen(false);
    setIsCreateNoteModalOpen(true);
  }, []);

  const getClientId = useCallback(() => {
    if (currentChat?.type === 'employee_client' && currentChat.clientId) {
      return currentChat.clientId;
    }
    return undefined;
  }, [currentChat]);

  const handleCreateNote = useCallback(async (noteData: { content: string; file?: File }) => {
    if (!selectedCreditId || !noteData.content) return;
    console.log(selectedCreditId);
    
    try {
      const noteRequest = {
        noteableType: NOTEABLE_TYPES.CREDIT,
        noteableId: selectedCreditId,
        content: noteData.content,
        file: noteData.file,
      };

      const result = await createNote(noteRequest);
      
      if (result) {
        setIsCreateNoteModalOpen(false);
        setSelectedCreditId(null);
        setSelectedMessage(null);
        setContextMenu(null);
        setNoteContent('');
        
        console.log('Заметка успешно создана:', result);
      }
    } catch (error) {
      console.error('Ошибка при создании заметки:', error);
      alert('Ошибка при создании заметки');
    }
  }, [selectedCreditId, selectedMessage]);

  const handleCloseCreateNoteModal = useCallback(() => {
    setIsCreateNoteModalOpen(false);
    setSelectedCreditId(null);
    setSelectedMessage(null);
    setSelectedFile(null);
    setNoteContent('');
    setContextMenu(null);
  }, []);

  const renderAttachmentPreviews = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        mt: 1,
        mb: 1
      }}>
        {previewAttachments.map(({url, file}, index) => (
          <Box key={index} sx={{ position: 'relative' }}>
            {file.type.startsWith('image/') ? (
              <img
                src={url}
                alt={file.name}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 4
                }}
              />
            ) : (
              <Chip
                label={file.name}
                variant="outlined"
                sx={{ maxWidth: 150 }}
              />
            )}
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'background.default'
                }
              }}
              onClick={() => removeAttachment(index)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    );
  };

  const DocumentIcon = () => (
    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
      <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Ошибка загрузки чатов: {error}</Typography>
      </Box>
    );
  }

  return (
    <ChatContainer>
      <ChatListContainer>
        <Box p={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: "30px", textAlign: "left", paddingLeft: "5px", color: "black" }}>
            Чаты
          </Typography>
          <SearchField
            onChange={(e) => searchChats(e.target.value)}
            placeholder="Поиск">
          </SearchField>
        </Box>
        <Divider />
        
        <List sx={{ overflowY: 'auto', flex: 1 }}>
          {chats.filter(chat => chat.type === 'general').map(chat => (
            <React.Fragment key={chat.id}>
              <ListItem 
                disablePadding
                secondaryAction={
                  chat.unreadCount > 0 && (
                    <Box 
                      sx={{
                        display: 'inline-flex',
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {chat.unreadCount}
                    </Box>
                  )
                }
              >
                <ListItemButton 
                  onClick={() => handleSelectChat(chat)}
                  selected={currentChat?.id === chat.id}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar 
                      alt={chat.name}
                      src={getChatAvatar(chat)}
                      sx={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    style={{marginLeft: "10px" }}
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight="normal" style={{color: "black"}}>{chat.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(chat.createdAt), 'dd.MM.yyyy')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="textSecondary"
                        sx={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getLastMessagePreview(chat)}
                      </Typography>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}

          {chats.filter(chat => chat.type === 'company').map(chat => (
            <React.Fragment key={chat.id}>
              <ListItem 
                disablePadding
                secondaryAction={
                  chat.unreadCount > 0 && (
                    <Box 
                      sx={{
                        display: 'inline-flex',
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {chat.unreadCount}
                    </Box>
                  )
                }
              >
                <ListItemButton 
                  onClick={() => handleSelectChat(chat)}
                  selected={currentChat?.id === chat.id}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar 
                      alt={chat.name}
                      src={getChatAvatar(chat)}
                      sx={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    style={{marginLeft: "10px" }}
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight="normal" style={{color: "black"}}>{chat.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(chat.createdAt), 'dd.MM.yyyy')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="textSecondary"
                        sx={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getLastMessagePreview(chat)}
                      </Typography>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
          
          {chats.filter(chat => chat.type !== 'general' && chat.type !== 'company' && chat.type !== 'private_chat').map(chat => (
            <React.Fragment key={chat.id}>
              <ListItem 
                disablePadding
                onContextMenu={(e) => handleChatRightClick(e, chat)}
                secondaryAction={
                  chat.unreadCount > 0 && (
                    <Box 
                      sx={{
                        display: 'inline-flex',
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {chat.unreadCount}
                    </Box>
                  )
                }
              >
                <ListItemButton 
                  onClick={() => handleSelectChat(chat)}
                  selected={currentChat?.id === chat.id}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar 
                      alt={chat.name}
                      src={getChatAvatar(chat)}
                      sx={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    style={{marginLeft: "10px" }}
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight="normal" style={{color: "black"}}>{chat.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(chat.createdAt), 'dd.MM.yyyy')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="textSecondary"
                        sx={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getLastMessagePreview(chat)}
                      </Typography>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </ChatListContainer>

      <ChatContentContainer>
        {!currentChat ? (
          <Box flex={1} display="flex" alignItems="center" justifyContent="center">
            <Typography variant="h6" color="textSecondary">
              Выберите чат для начала общения
            </Typography>
          </Box>
        ) : (
          <>
            <Box 
              p={2} 
              borderBottom="1px solid #eee" 
              display="flex" 
              alignItems="center"
              sx={{ cursor: 'pointer' }}
              onClick={handleOpenSide}
            >
              <Avatar 
                alt={currentChat.name}
                src={getChatAvatar(currentChat)}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Box>
                <Typography variant="h6" color='black'>{currentChat.name}</Typography>
              </Box>
              <Box sx={{ width: "75%", margin: "0 auto" }}>
                <SearchField
                    placeholder="Поиск в сообщениях"
                    value={localMessageSearch}
                    onChange={handleMessageSearchChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleMessageSearchSubmit()}
                />
              </Box>
            </Box>
                        
            <MessagesContainer>
              <List>
                {messages.length > 0 ? (
                  <>
                    {messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        onRightClick={handleMessageRightClick}
                        onTouchStart={handleMessageTouchStart}
                        onTouchEnd={handleMessageTouchEnd}
                        onUserClick={handleOpenUserChat}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <EmptyChatContainer>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Здесь пока нет сообщений
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {currentChat.type === 'general' 
                        ? "Начните общение в общем чате"
                        : currentChat.type === 'company'
                        ? "Это чат вашей компании"
                        : "Напишите первое сообщение в этом чате"}
                    </Typography>
                  </EmptyChatContainer>
                )}
              </List>
            </MessagesContainer>
            
            {attachments.length > 0 && renderAttachmentPreviews()}
            <MessageInput
              value={messageText}
              onChange={handleMessageChange}
              onSend={handleSendMessage}
              onAttach={() => fileInputRef.current?.click()}
              onCancelEdit={() => {
                setEditingMessage(null);
                setMessageText('');
              }}
              isEditing={!!editingMessage}
              hasAttachments={attachments.length > 0}
              placeholder={editingMessage ? "Редактирование сообщения..." : "Напишите сообщение..."}
              onKeyPress={handleKeyPress}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,video/*"
            />
          </>
        )}
      </ChatContentContainer>

      {typingUsers.length > 0 && (
        <Box sx={{ 
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          px: 2,
          py: 1,
          boxShadow: 1
        }}>
          <Typography variant="caption" color="textSecondary">
            {typingUsers.map(u => u.name).join(', ')} печатает...
          </Typography>
        </Box>
      )}

      <MessageContextMenu
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onMakeNote={handleMakeNote}
        onCopy={handleCopy}
        onDelete={handleDelete}
        messageType={selectedMessage?.attachments && selectedMessage.attachments.length > 0 ? 'file' : 'text'}
        canDelete={selectedMessage?.sender.id === currentUser?.id}
        canReply={true}
      />

      {chatContextMenu && (
        <ContextMenu
          x={chatContextMenu.x}
          y={chatContextMenu.y}
          onClose={() => setChatContextMenu(null)}
        >
          <MenuItem 
            danger 
            onClick={() => handleDeleteChat(chatContextMenu.chat)}
          >
            <DeleteIcon fontSize="small" />
            Удалить чат
          </MenuItem>
        </ContextMenu>
      )}
      
      {isSideOpen && currentChat && (
        <ChatSide onUserClick={handleOpenUserChat} chat={currentChat} onClose={handleCloseSide} />
      )}

      <SelectCreditModal
        isOpen={isSelectCreditModalOpen}
        onClose={() => setIsSelectCreditModalOpen(false)}
        onSelect={handleCreditSelect}
        clientId={getClientId()}
      />

      <CreateNoteModal
        isOpen={isCreateNoteModalOpen}
        onClose={handleCloseCreateNoteModal}
        onCreate={handleCreateNote}
        noteContent={noteContent}
        onNoteContentChange={setNoteContent}
        initialFile={selectedFile}
      />
    </ChatContainer>
  );
};

export default ChatPage;