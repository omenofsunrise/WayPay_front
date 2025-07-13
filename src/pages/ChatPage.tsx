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
  InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import useChat from '../api/hooks/useChat';
import type { Chat, Message } from '../api/types/chat';
import { format } from 'date-fns';
import { useEmployee } from '../api/hooks/useEmployee';
import { getInitials, generateAvatar } from '../utils/avatarUtils';
import { BASE_URL } from '../api/client';

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
    selectChat,
    searchChats,
    searchMessages,
  } = useChat();
  
  const [messageText, setMessageText] = useState('');
  const [localMessageSearch, setLocalMessageSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authInfo } = useEmployee();
  const currentUser = authInfo?.employee;
  
  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const senderName = chat.lastMessage.sender.fullName.split(' ')[0];
    return `${senderName}: ${chat.lastMessage.text.substring(0, 30)}${chat.lastMessage.text.length > 30 ? '...' : ''}`;
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'general') {
      return '/WayPay.png';
    }
    
    if (chat.avatarPath) {
      return BASE_URL + chat.avatarPath;
    }
    
    const initials = getInitials(chat.name);
    return generateAvatar(initials);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentChat) return;
    
    try {
      await sendMessage(currentChat.id, { text: messageText });
      setMessageText('');
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
    searchMessages(value); // Вызываем поиск сразу при изменении
  };

  const handleMessageSearchSubmit = () => {
    searchMessages(localMessageSearch);
  };

  const clearMessageSearch = () => {
    setLocalMessageSearch('');
    searchMessages('');
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Ошибка загрузки чатов: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100%">
      <Paper elevation={3} sx={{ width: 350, height: '100%', overflow: 'auto' }}>
        <Box p={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Чаты
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => searchChats(e.target.value)}
            sx={{ mt: 2 }}
          />
        </Box>
        <Divider />
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {chats.map((chat) => (
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
      </Paper>

      {/* Основная область чата */}
      <Box flex={1} display="flex" flexDirection="column">
        {!currentChat ? (
          <Box flex={1} display="flex" alignItems="center" justifyContent="center">
            <Typography variant="h6" color="textSecondary">
              Выберите чат для начала общения
            </Typography>
          </Box>
        ) : (
          <>
            {/* Шапка чата */}
            <Box p={2} borderBottom="1px solid #eee" display="flex" alignItems="center">
              <Avatar 
                alt={currentChat.name}
                src={getChatAvatar(currentChat)}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Typography variant="h6">{currentChat.name}</Typography>
            </Box>
            
            {/* Поиск по сообщениям */}
            <Box p={2} borderBottom="1px solid #eee">
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Поиск в сообщениях..."
                value={localMessageSearch}
                onChange={handleMessageSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleMessageSearchSubmit()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: localMessageSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={clearMessageSearch}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            {/* Сообщения */}
            <Box 
              flex={1} 
              p={2} 
              overflow="auto" 
              bgcolor="#f9f9f9"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              <List>
                {messages.map((message) => (
                  <ListItem 
                    key={message.id} 
                    alignItems="flex-start"
                    sx={{
                      flexDirection: message.sender.id === currentUser?.id ? 'row-reverse' : 'row',
                      px: 1,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar 
                        alt={message.sender.fullName} 
                        src={message.sender.photoPath || generateAvatar(getInitials(message.sender.fullName))}
                        sx={{ width: 32, height: 32 }}
                      />
                    </ListItemAvatar>
                    <Box 
                      sx={{
                        maxWidth: '70%',
                        bgcolor: message.sender.id === currentUser?.id ? '#e3f2fd' : '#fff',
                        borderRadius: 2,
                        p: 1.5,
                        boxShadow: 1,
                      }}
                    >
                      {message.sender.id !== currentUser?.id && (
                        <Typography variant="subtitle2" color="text.primary">
                          {message.sender.fullName}
                        </Typography>
                      )}
                      <Typography variant="body1" paragraph sx={{ mb: 0, wordBreak: 'break-word' }}>
                        {message.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ display: 'block', textAlign: 'right' }}
                      >
                        {formatMessageDate(message.sentAt)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>
            </Box>
            
            {/* Поле ввода сообщения */}
            <Box p={2} borderTop="1px solid #eee">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите сообщение..."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end" 
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;