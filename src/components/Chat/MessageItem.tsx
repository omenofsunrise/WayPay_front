import React, { useState, useEffect } from 'react';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { FILE_BASE_URL } from '../../api/client';
import useBlog from '../../api/hooks/useBlog';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import type { BlogPost } from '../../api/types/blog';
import type { Message } from '../../api/types/chat';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import PostItem from '../Blog/PostItem';

interface MessageItemProps {
  message: Message;
  currentUser: { id: number } | null;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onRightClick: (e: React.MouseEvent, message: Message) => void;
  onTouchStart: (message: Message) => void;
  onTouchEnd: () => void;
  onUserClick: (userId: number) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  onRightClick,
  onTouchStart,
  onTouchEnd,
  onUserClick
}) => {
  const { getPostById, toggleLike } = useBlog();
  const [postData, setPostData] = useState<BlogPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPostData, setLocalPostData] = useState<BlogPost | null>(null);

  // Загружаем данные поста при монтировании, если есть postId
  React.useEffect(() => {
    if (message.postId && !postData) {
      const loadPost = async () => {
        try {
          setLoadingPost(true);
          const post = await getPostById(message.postId!);
          setPostData(post);
          setLocalPostData(post);
        } catch (error) {
          console.error('Failed to load post:', error);
        } finally {
          setLoadingPost(false);
        }
      };
      
      loadPost();
    }
  }, [message.postId, getPostById]);

  const handleToggleLike = async (postId: number) => {
    if (!localPostData) return;
    
    try {
      setLiking(true);
      setError(null);
      
      // Оптимистичное обновление
      setLocalPostData(prev => {
        if (!prev) return null;
        const wasLiked = prev.isLikedByCurrentUser;
        return {
          ...prev,
          isLikedByCurrentUser: !wasLiked,
          likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1
        };
      });

      await toggleLike(postId);
      
      const updatedPost = await getPostById(postId);
      setLocalPostData(updatedPost);
    } catch (err) {
      setError('Не удалось поставить лайк');
      setLocalPostData(postData);
    } finally {
      setLiking(false);
    }
  };

  const getUserAvatar = (user: { fullName: string; photoPath?: string | null }) => {
    if (user.photoPath) {
      return FILE_BASE_URL + user.photoPath;
    }
    return generateAvatar(getInitials(user.fullName));
  };

  const renderMessageAttachments = (message: Message) => {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        mt: 1
      }}>
        {message.attachments.map((attachment, index) => {
          let fileUrl = attachment.fileUrl;
          
          if (!fileUrl.startsWith('http')) {
            if (!fileUrl.startsWith('/')) {
              fileUrl = '/' + fileUrl;
            }
            fileUrl = `${SOCIAL_BASE_URL}${fileUrl}`;
          }
          
          return (
            <Box key={index}>
              {attachment.contentType.startsWith('image/') ? (
                <img
                  src={fileUrl}
                  alt={attachment.fileName}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
              ) : attachment.contentType.startsWith('video/') ? (
                <video
                  controls
                  style={{
                    width: 200,
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  <source src={fileUrl} type={attachment.contentType} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<DocumentIcon />}
                  href={fileUrl}
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
          );
        })}
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

  const formatMessageDate = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <>
      <ListItem 
        alignItems="flex-start"
        sx={{
          flexDirection: message.sender.id === currentUser?.id ? 'row-reverse' : 'row',
          px: 1,
        }}
        onContextMenu={(e) => onRightClick(e, message)}
        onTouchStart={() => onTouchStart(message)}
        onTouchEnd={onTouchEnd}
      >
        {message.sender.id !== currentUser?.id && (
          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar 
              alt={message.sender.fullName} 
              src={getUserAvatar(message.sender)}
              sx={{ width: 32, height: 32 }}
              onClick={() => onUserClick(message.sender.id)}
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
          
          {loadingPost ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : message.postId && localPostData ? (
            <PostItem 
              post={localPostData}
              onToggleLike={handleToggleLike}
              onDeletePost={() => {}}
              onAvatarClick={(userId) => onUserClick(userId)}
              backgroundColor="transparent"
              borderColor="rgba(48, 119, 101, 1)"
              hasBorder={true}
              dividerColor="rgba(48, 119, 101, 1)"
              actionsBackground="transparent"
            />
          ) : null}
          
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

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </>
  );
};

export default MessageItem;