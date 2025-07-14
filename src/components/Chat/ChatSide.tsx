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
  Tabs,
  Grid,
  ImageList,
  ImageListItem,
  ListItemAvatar,
  Link as MuiLink,
  Skeleton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkIcon from '@mui/icons-material/Link';
import { format } from 'date-fns';
import type { Chat, ChatMember, MessageAttachmentResponse, ChatLinkResponse } from '../../api/types/chat';
import { BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import useChat from '../../api/hooks/useChat';

interface ChatSideProps {
  chat: Chat | null;
  onClose: () => void;
}

const ChatSide: React.FC<ChatSideProps> = ({ chat, onClose }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const { 
    chatMembers, 
    fetchChatMembers,
    chatPhotos,
    chatFiles,
    chatVideos,
    chatLinks,
    fetchChatPhotos,
    fetchChatFiles,
    fetchChatVideos,
    fetchChatLinks,
    isLoading
  } = useChat();
  
  React.useEffect(() => {
    if (chat?.id) {
      fetchChatMembers(chat.id);
      fetchChatPhotos(chat.id);
      fetchChatFiles(chat.id);
      fetchChatVideos(chat.id);
      fetchChatLinks(chat.id);
    }
  }, [chat?.id]);

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

  const renderMediaItem = (item: MessageAttachmentResponse) => {
    const isImage = item.contentType.startsWith('image/');
    const isVideo = item.contentType.startsWith('video/');
    
    return (
      <ListItem key={item.id} sx={{ px: 0 }}>
        <ListItemAvatar>
          {isImage ? (
            <Avatar 
              variant="rounded" 
              src={BASE_URL + item.fileUrl} 
              sx={{ width: 56, height: 56 }}
            />
          ) : isVideo ? (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <VideoLibraryIcon />
            </Avatar>
          ) : (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'secondary.main' }}>
              <InsertDriveFileIcon />
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={item.fileName}
          secondary={`${(item.fileSize / 1024).toFixed(1)} KB`}
          sx={{ ml: 1 }}
        />
      </ListItem>
    );
  };

  const renderLinkItem = (item: ChatLinkResponse) => (
    <ListItem key={item.messageId} sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar variant="rounded" sx={{ bgcolor: 'info.main' }}>
          <LinkIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <MuiLink href={item.url} target="_blank" rel="noopener">
            {item.url.length > 30 ? `${item.url.substring(0, 30)}...` : item.url}
          </MuiLink>
        }
        secondary={`Отправлено ${format(new Date(item.sentAt), 'dd.MM.yyyy')} `}
        sx={{ ml: 1 }}
      />
    </ListItem>
  );

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
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Информация" />
        <Tab label="Участники" />
        <Tab label="Фото" />
        <Tab label="Файлы" />
        <Tab label="Видео" />
        <Tab label="Ссылки" />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {activeTab === 0 && (
          <Box>
            <Typography variant="body1" paragraph>
              Тип чата: {chat.type === 'general' ? 'Общий чат' : 'Групповой чат'}
            </Typography>
            <Typography variant="body1">
              Создан: {format(new Date(chat.createdAt), 'dd.MM.yyyy HH:mm')}
            </Typography>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
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

        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Фотографии ({chatPhotos?.length ?? 0})
            </Typography>
            {isLoading ? (
              <Grid container spacing={1}>
                {[...Array(4)].map((_, index) => (
                  <Grid item xs={6} key={index}>
                    <Skeleton variant="rectangular" width="100%" height={120} />
                  </Grid>
                ))}
              </Grid>
            ) : chatPhotos.length > 0 ? (
              <ImageList cols={2} gap={8}>
                {chatPhotos.map((photo) => (
                  <ImageListItem key={photo.id}>
                    <img
                      src={`${BASE_URL}${photo.fileUrl}?w=164&h=164&fit=crop&auto=format`}
                      srcSet={`${BASE_URL}${photo.fileUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                      alt={photo.fileName}
                      loading="lazy"
                      style={{ borderRadius: 4 }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет фотографий
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Файлы ({chatFiles?.length ?? 0})
            </Typography>
            {isLoading ? (
              <Box>
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} variant="rectangular" width="100%" height={72} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : chatFiles.length > 0 ? (
              <List dense>
                {chatFiles.map(renderMediaItem)}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет файлов
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Видео ({chatVideos?.length ?? 0})
            </Typography>
            {isLoading ? (
              <Box>
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} variant="rectangular" width="100%" height={72} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : chatVideos.length > 0 ? (
              <List dense>
                {chatVideos.map(renderMediaItem)}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет видео
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 5 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Ссылки ({chatLinks?.length ?? 0})
            </Typography>
            {isLoading ? (
              <Box>
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} variant="rectangular" width="100%" height={72} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : chatLinks.length > 0 ? (
              <List dense>
                {chatLinks.map(renderLinkItem)}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет ссылок
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ChatSide;