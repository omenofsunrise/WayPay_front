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
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import type { Chat, MessageAttachmentResponse, ChatLinkResponse } from '../../api/types/chat';
import { FILE_BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import useChat from '../../api/hooks/useChat';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import useCredit from '../../api/hooks/useCredit';
import type { CreditListResponse } from '../../api/types/credit';
import type { PaginatedResponse } from '../../api/types/common';
import ViewCreditModal from '../modal/ViewCreditModal';

interface ChatSideProps {
  chat: Chat | null;
  onClose: () => void;
  onUserClick: (user: number) => void;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortDirection?: 'asc' | 'desc';
}

const ChatSide: React.FC<ChatSideProps> = ({ chat, onClose, onUserClick }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [openMediaModal, setOpenMediaModal] = React.useState(false);
  const [currentMedia, setCurrentMedia] = React.useState<MessageAttachmentResponse | null>(null);
  const [credits, setCredits] = React.useState<PaginatedResponse<CreditListResponse> | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = React.useState(false);
  const [selectedCreditId, setSelectedCreditId] = React.useState<number | null>(null); // Добавлено состояние для выбранного договора
  const [isCreditModalOpen, setIsCreditModalOpen] = React.useState(false); // Добавлено состояние для модального окна
  
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

  const { getCreditListByClient } = useCredit();

  React.useEffect(() => {
    if (chat?.id) {
      fetchChatMembers(chat.id);
      fetchChatPhotos(chat.id);
      fetchChatFiles(chat.id);
      fetchChatVideos(chat.id);
      fetchChatLinks(chat.id);
      
      if (chat.type === 'employee_client') {
        fetchClientCredits();
      }
    }
  }, [chat?.id, chat.type]);

  const fetchClientCredits = async () => {
    if (!chat?.clientId) {
      console.log('No clientId found for chat:', chat);
      return;
    }
    
    setIsLoadingCredits(true);
    try {
      console.log('Fetching credits for clientId:', chat.clientId);
      const creditData = await getCreditListByClient(chat.clientId);
      console.log('Credit data received:', creditData);
      
      if (creditData) {
        setCredits(creditData);
      } else {
        console.log('No credit data returned');
        setCredits(null);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Добавлены функции для работы с модальным окном договора
  const handleCreditClick = (creditId: number) => {
    setSelectedCreditId(creditId);
    setIsCreditModalOpen(true);
  };

  const handleCloseCreditModal = () => {
    setIsCreditModalOpen(false);
    setSelectedCreditId(null);
  };

  if (!chat) return null;

  console.log('Current chat:', {
    id: chat.id,
    type: chat.type,
    clientId: chat.clientId,
    name: chat.name
  });

  const getChatAvatar = () => {
    if (chat.type === 'general') {
      return '/WayPay.png';
    }
    
    if (chat.avatarPath) {
      return FILE_BASE_URL + chat.avatarPath;
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

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'Активный':
        return 'Активный';
      case 'Просроченный':
        return 'Просроченный';
      case 'Закрытый':
        return 'Закрытый';
      default:
        return status;
    }
  };

  const renderCreditItem = (credit: CreditListResponse) => {
    const getStatusStyles = (status: string) => {
      const statusLower = status.toLowerCase();
      
      if (statusLower === 'активный') {
        return {
          bgcolor: 'transparent',
          color: 'common.black',
          borderColor: 'rgba(0, 0, 0, 0.23)'
        };
      } else if (statusLower === 'просроченный') {
        return {
          bgcolor: 'rgba(232, 216, 216, 1)',
          color: 'common.black',
          borderColor: 'rgba(232, 216, 216, 1)'
        };
      } else if (statusLower === 'закрытый') {
        return {
          bgcolor: '#E8F5E8',
          color: '#1B5E20',
          borderColor: '#E8F5E8'
        };
      }
      
      return {
        bgcolor: 'transparent',
        color: 'common.black',
        borderColor: 'rgba(0, 0, 0, 0.23)'
      };
    };

    const statusStyles = getStatusStyles(credit.status);

    return (
      <ListItem 
        style={{ 
          margin: "10px 0", 
          boxShadow: "4px 2px 4px 3px rgba(0, 8, 9, 0.08)", 
          borderRadius: "10px", 
          backgroundColor: `${statusStyles.bgcolor}`, 
          padding: "5px 10px",
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          border: '2px solid transparent'
        }} 
        key={credit.id} 
        sx={{ 
          px: 0,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '4px 4px 8px 3px rgba(0, 8, 9, 0.12)',
            border: '2px solid rgba(0, 125, 136, 0.3)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        }}
        onClick={() => handleCreditClick(credit.id)}
      >
        <ListItemAvatar>
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(0, 125, 136, 0.3)' }}>
            <DescriptionIcon sx={{ color: 'rgba(0, 125, 136, 1)' }} />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                Договор №{credit.id}
              </Typography>
            </Box>
          }
          secondary={`Дата: ${format(new Date(credit.creditDate), 'dd.MM.yyyy')}`}
          sx={{ ml: 1 }}
      />
      </ListItem>
    );
  };

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

  const getTabs = () => {
    const baseTabs = ['Фото', 'Файлы', 'Видео', 'Ссылки'];
    if (chat.type === 'employee_client') {
      return ['Договоры', ...baseTabs];
    }
    return baseTabs;
  };

  const tabs = getTabs();

  return (
    <>
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

          {chatMembers?.length > 2 ? (
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
          ) : (
            <Chip 
              label={chat.type === 'employee_client' ? "Клиент" : "Сотрудник"}
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
          )}
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
          {tabs.map((label, index) => (
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
          {activeTab === 0 && chat.type === 'employee_client' && (
            <Box>
              {isLoadingCredits ? (
                <Box>
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} variant="rectangular" width="100%" height={72} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : credits && credits.items && credits.items.length > 0 ? (
                <List dense>
                  {credits.items.map(renderCreditItem)}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Нет договоров
                </Typography>
              )}
            </Box>
          )}

          {activeTab === (chat.type === 'employee_client' ? 1 : 0) && (
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

          {activeTab === (chat.type === 'employee_client' ? 2 : 1) && (
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

          {activeTab === (chat.type === 'employee_client' ? 3 : 2) && (
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

          {activeTab === (chat.type === 'employee_client' ? 4 : 3) && (
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
                {currentMedia.contentType.startsWith('image/') ? (
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

      {selectedCreditId && (
        <ViewCreditModal
          id={selectedCreditId}
          isOpen={isCreditModalOpen}
          onClose={handleCloseCreditModal}
        />
      )}
    </>
  );
};

export default ChatSide;