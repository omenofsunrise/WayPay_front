import React, { useEffect, useState, useRef } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Divider, 
  Box, 
  CircularProgress, 
  Paper, 
  ListItemButton,
  TextField,
  IconButton,
  Avatar,
  ListItemAvatar,
  InputAdornment,
  Button,
  Chip
} from '@mui/material';
import useChat from '../api/hooks/useChat';
import type { Chat, Message } from '../api/types/chat';
import { format } from 'date-fns';
import { useEmployee } from '../api/hooks/useEmployee';
import { getInitials, generateAvatar } from '../utils/avatarUtils';
import { BASE_URL } from '../api/client';
import CloseIcon from '@mui/icons-material/Close';
import { SOCIAL_BASE_URL } from '../api/socialApiClient';
import styled from "styled-components";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatSide from '../components/Chat/ChatSide';
import SearchField from '../components/Chat/SearchField';
import MessageInput from '../components/Chat/MessageInput';

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
  height: calc(100vh - 64px); // Adjust based on your header height
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

const ChatPage = () => {
  const {
    chats,
    messages,
    currentChat,
    isLoading,
    error,
    searchQuery,
    messageSearchQuery,
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
    fetchChatMembers
  } = useChat();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [localMessageSearch, setLocalMessageSearch] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authInfo } = useEmployee();
  const currentUser = authInfo?.employee;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSideOpen, setIsSideOpen] = useState(false);

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
    }
  }, [currentChat, fetchChatMembers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAttachments(e.target.files);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const senderName = chat.lastMessage.sender.fullName.split(' ')[0];
    return `${senderName}: ${chat.lastMessage.text.substring(0, 30)}${chat.lastMessage.text.length > 30 ? '...' : ''}`;
  };

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
      return BASE_URL + chat.avatarPath;
    }
    
    return generateAvatar(getInitials(chat.name));
  };

  const getUserAvatar = (user: { fullName: string; photoPath?: string | null }) => {
    if (user.photoPath) {
      return BASE_URL + user.photoPath;
    }
    return generateAvatar(getInitials(user.fullName));
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
      }
      setMessageText('');
      setAttachments([]);
      setPreviewAttachments([]);
    } catch (err) {
      console.error('Failed to send message:', err);
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

  const clearMessageSearch = () => {
    setLocalMessageSearch('');
    searchMessages('');
  };

  const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    if (message.sender.id !== currentUser?.id) return;
    
    setContextMenu({
      message,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMessageTouchStart = (message: Message) => {
    if (message.sender.id !== currentUser?.id) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({
        message,
        x: 100,
        y: 100,
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
    setMessageText(message.text);
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
      setContextMenu(null);
    }
  };

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

  const renderMessageAttachments = (message: Message) => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        mt: 1
      }}>
        {message.attachments.map((attachment, index) => (
          <Box key={index}>
            {attachment.contentType.startsWith('image/') ? (
              <a 
                href={SOCIAL_BASE_URL + attachment.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img
                  src={SOCIAL_BASE_URL + attachment.fileUrl}
                  alt={attachment.fileName}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                />
              </a>
            ) : attachment.contentType.startsWith('video/') ? (
              <video
                controls
                style={{
                  width: 200,
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                <source src={SOCIAL_BASE_URL + attachment.fileUrl} type={attachment.contentType} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Button
                variant="outlined"
                startIcon={<DocumentIcon />}
                href={SOCIAL_BASE_URL + attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {attachment.fileName}
              </Button>
            )}
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

const renderMessageTextWithLinks = (text: string) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)|(^|\s)([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+[^\s]*)/g;
  
  return text.split(' ').map((word, i) => {
    if (word.match(/^https?:\/\/[^\s]+/)) {
      return (
        <a key={i} href={word} target="_blank" rel="noopener noreferrer" style={{ color: '#007D88' }}>
          {word + ' '}
        </a>
      );
    }
    else if (word.match(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+[^\s]*/) && !word.endsWith('.')) {
      return (
        <a key={i} href={`https://${word}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007D88' }}>
          {word + ' '}
        </a>
      );
    }
    return word + ' ';
  });
};

  const renderMessageItem = (message: Message) => (
    <ListItem 
      key={message.id} 
      alignItems="flex-start"
      sx={{
        flexDirection: message.sender.id === currentUser?.id ? 'row-reverse' : 'row',
        px: 1,
      }}
      onContextMenu={(e) => handleMessageRightClick(e, message)}
      onTouchStart={() => handleMessageTouchStart(message)}
      onTouchEnd={handleMessageTouchEnd}
    >
      {message.sender.id !== currentUser?.id && (
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar 
            alt={message.sender.fullName} 
            src={getUserAvatar(message.sender)}
            sx={{ width: 32, height: 32 }}
          />
        </ListItemAvatar>
      )}
      <Box 
        sx={{
          maxWidth: '70%',
          bgcolor: message.sender.id === currentUser?.id ? 'rgba(0, 125, 136, 0.3)' : 'rgba(226, 227, 231, 1)',
          color: "black",
          borderRadius: 2,
          p: 1.5,
          boxShadow: 1,
          position: 'relative',
          paddingRight: '50px'
        }}
      >
        {message.sender.id !== currentUser?.id && (
          <Typography variant="subtitle2" sx={{ color: 'rgba(0, 125, 136, 1)', fontWeight: 550 }}>
            {message.sender.fullName}
          </Typography>
        )}
        {message.text && (
          <Typography variant="body1" paragraph sx={{ mb: 0, wordBreak: 'break-word' }}>
            {renderMessageTextWithLinks(message.text)}
          </Typography>
        )}
        {renderMessageAttachments(message)}
        <Typography 
          variant="caption" 
          color="textSecondary"
          sx={{ 
            position: 'absolute',
            right: 8,
            bottom: 8
          }}
        >
          {formatMessageDate(message.sentAt)}
        </Typography>
      </Box>
    </ListItem>
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: "30px", textAlign: "left", paddingLeft: "5px" }}>
            Чаты
          </Typography>
          <SearchField
            onChange={(e) => searchChats(e.target.value)}
            placeholder="Поиск">
          </SearchField>
        </Box>
        <Divider />
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ overflowY: 'auto', flex: 1 }}>
            {/* Сначала общий чат */}
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
                    onClick={() => selectChat(chat)}
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
                          <Typography fontWeight="bold">{chat.name}</Typography>
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

            {/* Затем чат компании */}
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
                    onClick={() => selectChat(chat)}
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
                          <Typography fontWeight="bold">{chat.name}</Typography>
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

            {/* Добавляем разделитель перед остальными чатами */}
            {(chats.some(chat => chat.type === 'general' || chat.type === 'company') && 
            chats.some(chat => chat.type !== 'general' && chat.type !== 'company')) && (
              <Divider sx={{ my: 1 }} />
            )}

            {/* Затем все остальные чаты */}
            {chats.filter(chat => chat.type !== 'general' && chat.type !== 'company').map(chat => (
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
                    onClick={() => selectChat(chat)}
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
                          <Typography fontWeight="bold">{chat.name}</Typography>
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
        )}
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
                <Typography variant="h6">{currentChat.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {chatMembers.length} участников
                </Typography>
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
                {messages.map(renderMessageItem)}
                <div ref={messagesEndRef} />
              </List>
            </MessagesContainer>
            
              {attachments.length > 0 && renderAttachmentPreviews()}
<MessageInput
  value={messageText}
  onChange={(e) => setMessageText(e.target.value)}
  onSend={handleSendMessage}
  onAttach={() => fileInputRef.current?.click()}
  onCancelEdit={() => {
    setEditingMessage(null);
    setMessageText('');
  }}
  isEditing={!!editingMessage}
  hasAttachments={attachments.length > 0}  // Это правильный пропс
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <MenuItem onClick={() => handleEditMessage(contextMenu.message)}>
            <EditIcon fontSize="small" />
            Редактировать
          </MenuItem>
          <MenuItem 
            danger 
            onClick={() => handleDeleteMessage(contextMenu.message)}
          >
            <DeleteIcon fontSize="small" />
            Удалить
          </MenuItem>
        </ContextMenu>
      )}
      
      {isSideOpen && currentChat && (
        <ChatSide chat={currentChat} onClose={handleCloseSide} />
      )}
    </ChatContainer>
  );
};

export default ChatPage;