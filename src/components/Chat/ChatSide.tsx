import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import type { Chat } from '../../api/types/chat';
import { BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';

interface ChatSideProps {
  chat: Chat | null;
  onClose: () => void;
}

const ChatSide: React.FC<ChatSideProps> = ({ chat, onClose }) => {
  if (!chat) return null;

  const getChatAvatar = () => {
    if (chat.type === 'general') {
      return '/WayPay.png';
    }
    
    if (chat.avatarPath) {
      return BASE_URL + chat.avatarPath;
    }
    
    const initials = getInitials(chat.name);
    return generateAvatar(initials);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{
        width: 350,
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        borderRadius: 0
      }}
    >
      <Box 
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6">Информация о чате</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          src={getChatAvatar()}
          alt={chat.name}
          sx={{ width: 120, height: 120, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          {chat.name}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        </Typography>
        <List dense>
        </List>
      </Box>

        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Описание
            </Typography>
            <Typography variant="body2">
            </Typography>
          </Box>
        </>
    </Paper>
  );
};

export default ChatSide;