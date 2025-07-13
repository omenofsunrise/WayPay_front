import React, { useEffect } from 'react';
import { List, ListItem, ListItemText, Typography, Divider, Box, CircularProgress, Paper, ListItemButton } from '@mui/material';
import useChat from '../api/hooks/useChat';
import type { Chat } from '../api/types/chat';

const ChatPage: React.FC = () => {
  const {
    chats,
    isLoading,
    error,
    fetchUserChats,
    selectChat,
    currentChat,
  } = useChat();

  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const senderName = chat.lastMessage.sender.fullName.split(' ')[0];
    return `${senderName}: ${chat.lastMessage.text.substring(0, 30)}${chat.lastMessage.text.length > 30 ? '...' : ''}`;
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Ошибка загрузки чатов: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh">
      {/* Панель чатов */}
      <Paper elevation={3} sx={{ width: 350, height: '100%', overflow: 'auto' }}>
        <Box p={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Чаты
          </Typography>
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
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography fontWeight="bold">{chat.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {chat.createdAt}
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

      {/* Основная область (пока пустая, будет добавлена позже) */}
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        {!currentChat ? (
          <Typography variant="h6" color="textSecondary">
            Выберите чат для начала общения
          </Typography>
        ) : (
          <Typography variant="h6">
            Чат: {currentChat.name}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;