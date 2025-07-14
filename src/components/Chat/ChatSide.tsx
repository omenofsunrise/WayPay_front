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
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import type { Chat, ChatMember } from '../../api/types/chat';
import { BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import useChat from '../../api/hooks/useChat';

interface ChatSideProps {
  chat: Chat | null;
  onClose: () => void;
}

const ChatSide: React.FC<ChatSideProps> = ({ chat, onClose }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const { chatMembers, fetchChatMembers } = useChat();
  
  React.useEffect(() => {
    if (chat?.id) {
      fetchChatMembers(chat.id);
    }
  }, [chat?.id, fetchChatMembers]);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
        <Chip 
            label={`${chatMembers?.length ?? 0} участников`} 
            size="small" 
            sx={{ mt: 1 }}
        />
      </Box>

      <Divider />

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Информация" />
        <Tab label="Участники" />
      </Tabs>

      {activeTab === 0 && (
        <Box sx={{ p: 2 }}>
          {/* Добавьте дополнительную информацию о чате здесь */}
          <Typography variant="body1" paragraph>
            Тип чата: {chat.type === 'general' ? 'Общий чат' : 'Групповой чат'}
          </Typography>
          <Typography variant="body1">
            Создан: {format(new Date(chat.createdAt), 'dd.MM.yyyy HH:mm')}
          </Typography>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Участники ({chatMembers?.length ?? 0})
          </Typography>
          <List dense>
            {chatMembers.map((member) => (
              <ListItem key={member.id} sx={{ px: 0 }}>
                <Avatar 
                  src={member.photoPath ? BASE_URL + member.photoPath : generateAvatar(getInitials(member.fullName))}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <ListItemText
                  primary={member.fullName}
                  secondary={member.role || ''}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default ChatSide;