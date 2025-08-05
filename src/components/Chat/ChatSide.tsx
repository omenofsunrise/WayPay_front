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
  Skeleton,
  Modal,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import type { Chat, ChatMember, MessageAttachmentResponse, ChatLinkResponse } from '../../api/types/chat';
import { BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import useChat from '../../api/hooks/useChat';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import type { Employee } from '../../api/types/employee';

interface ChatSideProps {
  chat: Chat | null;
  onClose: () => void;
  onUserClick: (user: number) => void;
}

const ChatSide: React.FC<ChatSideProps> = ({ chat, onClose, onUserClick }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [openMediaModal, setOpenMediaModal] = React.useState(false);
  const [currentMedia, setCurrentMedia] = React.useState<MessageAttachmentResponse | null>(null);
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
    isLoading,
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

  const handleOpenMedia = (media: MessageAttachmentResponse) => {
    setCurrentMedia(media);
    setOpenMediaModal(true);
  };

  const handleCloseMedia = () => {
    setOpenMediaModal(false);
    setCurrentMedia(null);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = SOCIAL_BASE_URL + fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const FileIcon = () => (
    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
      <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const renderMediaItem = (item: MessageAttachmentResponse) => {
  const isImage = item.contentType.startsWith('image/');
  const isVideo = item.contentType.startsWith('video/');
  
  const fileUrl = item.fileUrl.startsWith('http') 
    ? item.fileUrl 
    : `${SOCIAL_BASE_URL}${item.fileUrl.startsWith('/') ? '' : '/'}${item.fileUrl}`;

  return (
      <ListItem 
        key={item.id} 
        sx={{ px: 0, cursor: 'pointer' }}
        onClick={() => handleOpenMedia(item)}
      >
        <ListItemAvatar>
          {isImage ? (
            <Avatar 
              variant="rounded" 
              src={fileUrl}
              sx={{ width: 56, height: 56 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          ) : isVideo ? (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'rgba(0, 125, 136, 0.3)' }}>
              <VideoLibraryIcon sx={{ color: 'rgba(0, 125, 136, 1)' }} />
            </Avatar>
          ) : (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'rgba(0, 125, 136, 0.3)' }}>
              <FileIcon />
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={item.fileName}
          secondary={`${(item.fileSize / 1024).toFixed(1)} KB`}
          sx={{ ml: 1 }}
        />
        <IconButton 
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(item.fileUrl, item.fileName);
          }}
          sx={{ color: 'rgba(0, 125, 136, 1)' }}
        >
          <DownloadIcon />
        </IconButton>
      </ListItem>
    );
  };

  const renderLinkItem = (item: ChatLinkResponse) => (
    <ListItem key={item.messageId} sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar variant="rounded" sx={{ bgcolor: 'rgba(0, 125, 136, 0.3)' }}>
          <LinkIcon sx={{ color: 'rgba(0, 125, 136, 1)' }} />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <MuiLink 
            href={item.url} 
            target="_blank" 
            rel="noopener"
            sx={{ 
              color: 'rgba(37, 203, 161, 1)',
              '&:hover': {
                color: 'rgba(0, 125, 136, 1)'
              }
            }}
          >
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
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          p: 2,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', left: 16, top: 16 }}>
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
          sx={{ 
            mt: 1,
            color: 'rgba(80, 85, 92, 1)',
            backgroundColor: 'transparent',
            '& .MuiChip-label': {
              px: 0.5,
            },
            border: 'none',
            boxShadow: 'none',
            fontSize: '14px',
            margin: 0
          }}
        />
      </Box>

      <Divider />

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            display: 'none'
          },
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          WebkitOverflowScrolling: 'touch',
          whiteSpace: 'nowrap'
        }}
      >
        {['Участники', 'Фото', 'Файлы', 'Видео', 'Ссылки'].map((label, index) => (
          <Tab
            key={index}
            label={label}
            sx={{
              color: 'common.black',
              outline: 'none',
              textTransform: 'none',
              fontSize: '0.875rem',
              borderRadius: '10px',
              '&.Mui-selected': {
                backgroundColor: 'rgba(89, 212, 188, 1)',
                color: 'common.black',
                borderRadius: '10px',
                mx: 0.5
              },
              px: 2,
              my: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:focus': {
                outline: 'none',
                boxShadow: 'none',
              },
              minWidth: 'auto',
              flexShrink: 0
            }}
          />
        ))}
      </Tabs>

      <Box sx={{ p: 2 }}>
        {activeTab === 0 && (
          <Box>
            <List dense>
              {chatMembers.map((member) => (
                <ListItem 
                onClick={() => onUserClick(member.id)}
                key={member.id} sx={{ px: 0 }}>
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

        {activeTab === 1 && (
          <Box>
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
                {chatPhotos.map((photo) => {
                  const photoUrl = photo.fileUrl.startsWith('http') 
                    ? photo.fileUrl 
                    : `${SOCIAL_BASE_URL}${photo.fileUrl.startsWith('/') ? '' : '/'}${photo.fileUrl}`;
                  
                  return (
                    <ImageListItem 
                      key={photo.id} 
                      onClick={() => handleOpenMedia(photo)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <img
                        src={`${photoUrl}?w=164&h=164&fit=crop&auto=format`}
                        srcSet={`${photoUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                        alt={photo.fileName}
                        loading="lazy"
                        style={{ borderRadius: 4 }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </ImageListItem>
                  );
                })}
              </ImageList>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет фотографий
              </Typography>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
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

        {activeTab === 3 && (
          <Box>
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

        {activeTab === 4 && (
          <Box>
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

      <Dialog
        open={openMediaModal}
        onClose={handleCloseMedia}
        maxWidth="md"
        fullWidth
      >
        {currentMedia && (
          <>
            <DialogTitle>{currentMedia.fileName}</DialogTitle>
            <DialogContent>
              {currentMedia && (
                currentMedia.contentType.startsWith('image/') ? (
                  <img
                    src={currentMedia.fileUrl.startsWith('http') 
                      ? currentMedia.fileUrl 
                      : `${SOCIAL_BASE_URL}${currentMedia.fileUrl.startsWith('/') ? '' : '/'}${currentMedia.fileUrl}`}
                    alt={currentMedia.fileName}
                    style={{ width: '100%', height: 'auto' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                ) : currentMedia.contentType.startsWith('video/') ? (
                  <video controls style={{ width: '100%' }}>
                    <source 
                      src={currentMedia.fileUrl.startsWith('http') 
                        ? currentMedia.fileUrl 
                        : `${SOCIAL_BASE_URL}${currentMedia.fileUrl.startsWith('/') ? '' : '/'}${currentMedia.fileUrl}`} 
                      type={currentMedia.contentType} 
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <FileIcon />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      {currentMedia.fileName}
                    </Typography>
                    <Typography variant="body2">
                      {(currentMedia.fileSize / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                )
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => handleDownload(currentMedia.fileUrl, currentMedia.fileName)}
                startIcon={<DownloadIcon />}
                sx={{ color: 'rgba(0, 125, 136, 1)' }}
              >
                Скачать
              </Button>
              <Button onClick={handleCloseMedia}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default ChatSide;