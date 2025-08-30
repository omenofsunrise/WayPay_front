import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { BlogPost, FileAttachment } from '../../api/types/blog';
import { formatDate } from '../../utils/dateFormatter';
import { FILE_BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import PhotoViewerModal from '../modal/PhotoViewerModal';
import CommentsModal from '../modal/CommentsModal';
import { LikeButton, CommentButton, ShareButton } from '../ui/Buttons/SocialButtons';
import useChat from '../../api/hooks/useChat';
import Checkbox from '../ui/CheckBoxes/Checkbox';
import type { Chat } from '../../api/types/chat';

interface PostItemProps {
  post: BlogPost;
  onToggleLike: (postId: number) => void;
  onDeletePost?: (postId: number) => void;
  onEditPost?: (post: BlogPost) => void;
  onAvatarClick?: (id: number) => void;
  backgroundColor?: string;
  borderColor?: string;
  hasBorder?: boolean;
  dividerColor?: string;
  actionsBackground?: string;
}

const PostItem: React.FC<PostItemProps> = ({
  post, 
  onToggleLike, 
  onDeletePost, 
  onEditPost,
  onAvatarClick, 
  backgroundColor = 'white',
  borderColor = 'rgba(209, 213, 219, 1)',
  hasBorder = true,
  dividerColor = '#eee',
  actionsBackground = 'transparent'
}) => {
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareText, setShareText] = useState('');
  const {
    chats,
    fetchUserChats,
    searchChats,
    sendMessage
  } = useChat();

  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  const avatarSrc = post.authorAvatarPath 
    ? FILE_BASE_URL + post.authorAvatarPath 
    : generateAvatar(getInitials(post.authorName));

  const handleFileDownload = (file: FileAttachment) => {
    const link = document.createElement('a');
    link.href = SOCIAL_BASE_URL + file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = () => {
    setIsContextMenuOpen(false);
    onEditPost && onEditPost(post);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsContextMenuOpen(!isContextMenuOpen);
  };

  const handleDeleteClick = () => {
    setIsContextMenuOpen(false);
    onDeletePost && onDeletePost(post.id);
  };

  const handleCommentsClick = () => {
    setIsCommentsModalOpen(true);
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
    setSelectedChats([]);
    setShareSuccess(false);
    setShareText('');
  };

  const handleChatSelect = (chatId: number) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId) 
        : [...prev, chatId]
    );
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

  const handleShareSubmit = async () => {
    if (selectedChats.length === 0) return;
    
    setIsSharing(true);
    
    try {
      const sharePromises = selectedChats.map(chatId => {
        return sendMessage(chatId, {
          text: shareText,
          attachments: [],
          postId: post.id
        });
      });

      await Promise.all(sharePromises);
      
      setShareSuccess(true);
      setIsShareModalOpen(false);
      setShareSuccess(false);
      setShareText('');
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <PostItemContainer 
      $backgroundColor={backgroundColor}
      $borderColor={borderColor}
      $hasBorder={hasBorder}
    >
      <PostHeader>
        <AuthorInfoContainer>
          <AuthorAvatar 
            src={avatarSrc} 
            alt={post.authorName}
            onClick={() => onAvatarClick && onAvatarClick(post.authorId)}
            style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
          />
          <AuthorInfo>
            <AuthorName>{post.authorName}</AuthorName>
            <PostDate>{formatDate(post.createdAt)}</PostDate>
          </AuthorInfo>
        </AuthorInfoContainer>
        
        {post.isAuthor && (
          <ContextMenuContainer>
            <ContextMenuButton onClick={handleContextMenuClick}>
              <svg width="17" height="4" viewBox="0 0 17 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.88065 0C0.84629 0 0 0.84629 0 1.88065C0 2.915 0.84629 3.76129 1.88065 3.76129C2.915 3.76129 3.76129 2.915 3.76129 1.88065C3.76129 0.84629 2.915 0 1.88065 0ZM15.0452 0C14.0108 0 13.1645 0.84629 13.1645 1.88065C13.1645 2.915 14.0108 3.76129 15.0452 3.76129C16.0795 3.76129 16.9258 2.915 16.9258 1.88065C16.9258 0.84629 16.0795 0 15.0452 0ZM8.4629 0C7.42855 0 6.58226 0.84629 6.58226 1.88065C6.58226 2.915 7.42855 3.76129 8.4629 3.76129C9.49726 3.76129 10.3435 2.915 10.3435 1.88065C10.3435 0.84629 9.49726 0 8.4629 0Z" fill="#50555C"/>
              </svg>
            </ContextMenuButton>
            
          {isContextMenuOpen && (
            <ContextMenu>
              <ContextMenuItem onClick={handleEditClick}>Редактировать</ContextMenuItem>
              <ContextMenuItem onClick={handleDeleteClick}>Удалить</ContextMenuItem>
            </ContextMenu>
          )}
          </ContextMenuContainer>
        )}
      </PostHeader>
      
      <PostContent>
        <p>{post.content}</p>
      </PostContent>
      
      {post.imageUrls && post.imageUrls.length > 0 && (
        <PostImages $singleImage={post.imageUrls.length === 1}>
          {post.imageUrls.map((image, index) => (
            <PostImage 
              key={index} 
              src={SOCIAL_BASE_URL + image}
              alt={`Post image ${index + 1}`} 
              $singleImage={post.imageUrls.length === 1}
              onClick={() => {
                setCurrentPhotoIndex(index);
                setIsPhotoViewerOpen(true);
              }}
            />
          ))}
        </PostImages>
      )}
      
      {post.attachments && post.attachments.length > 0 && (
        <FilesContainer>
          {post.attachments.map((file, index) => (
            <FileItem 
              key={index} 
              onClick={() => handleFileDownload(file)}
              title={`Скачать ${file.name}`}
            >
              <FileIcon>
                <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
                  <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </FileIcon>
              <FileInfo>
                <FileName>{file.name}</FileName>
                <FileSize>{formatFileSize(file.size)}</FileSize>
              </FileInfo>
              <DownloadIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 11.25L4 7.25L4.93333 6.30667L7.33333 8.7V0.25H8.66667V8.7L11.0667 6.30667L12 7.25L8 11.25ZM3.33333 15.75C2.89131 15.75 2.46738 15.5744 2.15482 15.2618C1.84226 14.9493 1.66667 14.5254 1.66667 14.0833V10.75H3V14.0833C3 14.1361 3.04333 14.1667 3.06667 14.1667H12.9333C12.9567 14.1667 13 14.1361 13 14.0833V10.75H14.3333V14.0833C14.3333 14.5254 14.1577 14.9493 13.8452 15.2618C13.5326 15.5744 13.1087 15.75 12.6667 15.75H3.33333Z" fill="#007D88"/>
                </svg>
              </DownloadIcon>
            </FileItem>
          ))}
        </FilesContainer>
      )}
      
      <PostFooter 
        $dividerColor={dividerColor}
        $actionsBackground={actionsBackground}
      >
        <LikeButton 
          isLiked={post.isLikedByCurrentUser} 
          count={post.likesCount} 
          onClick={() => onToggleLike(post.id)} 
          $background={actionsBackground}
        />
        
        <CommentButton 
          count={post.commentsCount} 
          onClick={handleCommentsClick} 
          $background={actionsBackground}
        />
        
        <ShareButton 
          onClick={handleShareClick} 
          $background={actionsBackground}
        />
      </PostFooter>
      
      {isPhotoViewerOpen && post.imageUrls && (
        <PhotoViewerModal 
          images={post.imageUrls.map(url => SOCIAL_BASE_URL + url)}
          initialIndex={currentPhotoIndex}
          onClose={() => setIsPhotoViewerOpen(false)}
        />
      )}

      {isCommentsModalOpen && (
        <CommentsModal 
          post={post}
          onClose={() => setIsCommentsModalOpen(false)}
          onCommentAdded={() => {}}
        />
      )}

      {isShareModalOpen && (
        <ShareModalOverlay>
          <ShareModalContainer>
            {shareSuccess ? (
              <SuccessMessage>
                <SuccessIcon>
                  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.3438 2.375H4.65625C3.67249 2.375 2.875 3.17249 2.875 4.15625V14.8438C2.875 15.8275 3.67249 16.625 4.65625 16.625H15.3438C16.3275 16.625 17.125 15.8275 17.125 14.8438V4.15625C17.125 3.17249 16.3275 2.375 15.3438 2.375Z" fill="#007D88" stroke="#007D88" stroke-linejoin="round"/>
                    <path d="M13.5625 6.53125L8.575 12.4688L6.4375 10.0938" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </SuccessIcon>
                <SuccessText>Пост успешно отправлен в выбранные чаты!</SuccessText>
              </SuccessMessage>
            ) : (
              <>
                <ShareModalHeader>
                  <ShareModalTitle>Поделиться постом</ShareModalTitle>
                  <CloseButton onClick={() => setIsShareModalOpen(false)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="#50555C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="#50555C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </CloseButton>
                </ShareModalHeader>
                
                <ShareTextArea
                  placeholder="Добавьте сообщение к посту (необязательно)"
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  maxLength={500}
                />
                
                <SearchInput 
                  type="text" 
                  placeholder="Поиск чатов..." 
                  onChange={(e) => searchChats(e.target.value)}
                />
                
                <ChatsList>
                  {chats.map(chat => (
                    <ChatItem key={chat.id} onClick={() => handleChatSelect(chat.id)}>
                      <Checkbox
                        checked={selectedChats.includes(chat.id)}
                        onChange={() => {}}
                      />
                      <ChatAvatar 
                        src={getChatAvatar(chat)} 
                        alt={chat.name}
                      />
                      <ChatInfo>
                        <ChatName>{chat.name}</ChatName>
                        <ChatLastMessage>
                          {chat.lastMessage?.text ? (
                            chat.lastMessage.text.length > 30 
                              ? `${chat.lastMessage.text.substring(0, 30)}...` 
                              : chat.lastMessage.text
                          ) : 'Нет сообщений'}
                        </ChatLastMessage>
                      </ChatInfo>
                    </ChatItem>
                  ))}
                </ChatsList>
                
                <ShareModalFooter>
                  <ShareButtonText>
                    {selectedChats.length > 0 
                      ? `Выбрано чатов: ${selectedChats.length}` 
                      : 'Выберите чаты для отправки'}
                  </ShareButtonText>
                  <ShareSubmitButton 
                    onClick={handleShareSubmit}
                    disabled={selectedChats.length === 0 || isSharing}
                  >
                    {isSharing ? (
                      <Spinner>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3.5C13.5899 3.5 16.5 6.41015 16.5 10C16.5 10.4142 16.1642 10.75 15.75 10.75C15.3358 10.75 15 10.4142 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15C10.4142 15 10.75 15.3358 10.75 15.75C10.75 16.1642 10.4142 16.5 10 16.5C6.41015 16.5 3.5 13.5899 3.5 10C3.5 6.41015 6.41015 3.5 10 3.5Z" fill="white"/>
                        </svg>
                      </Spinner>
                    ) : 'Отправить'}
                  </ShareSubmitButton>
                </ShareModalFooter>
              </>
            )}
          </ShareModalContainer>
        </ShareModalOverlay>
      )}
    </PostItemContainer>
  );
};

const ShareTextArea = styled.textarea`
  padding: 12px 16px;
  margin: 10px 16px 0px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  resize: none;
  min-height: 80px;
  font-family: inherit;
  background-color: white;
  color: black;

  &:focus {
    border-color: #007D88;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const ShareModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ShareModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ShareModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const ShareModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const SearchInput = styled.input`
  padding: 12px 16px;
  margin: 10px 16px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  color: black;

  &:focus {
    border-color: #007D88;
  }
`;

const ChatsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  gap: 15px;

  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const ChatAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatLastMessage = styled.div`
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ShareModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
`;

const ShareButtonText = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const ShareSubmitButton = styled.button`
  background-color: #007D88;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  
  &:hover {
    background-color: #006670;
  }
  
  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  animation: spin 1s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const SuccessIcon = styled.div`
  margin-bottom: 20px;
  width: 40px; 
  height: 40px;
  
  & svg {
    width: 100%; 
    height: 100%;
  }
`;
const SuccessText = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const PostItemContainer = styled.div<{ 
  $backgroundColor?: string;
  $borderColor?: string;
  $hasBorder?: boolean;
}>`
  background: ${({ $backgroundColor }) => $backgroundColor};
  border-radius: 10px;
  padding: 20px;
  margin: 10px 0;
  border: ${({ $hasBorder, $borderColor }) => 
    $hasBorder ? `1px solid ${$borderColor}` : 'none'};
  color: black;
  text-align: left;
  position: relative;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const AuthorInfoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const AuthorAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.h3`
  font-weight: 600;
  margin: 0;
  font-size: 16px;
`;

const PostDate = styled.p`
  color: #6B7280;
  font-size: 14px;
  margin: 0;
`;

const ContextMenuContainer = styled.div`
  position: relative;
`;

const ContextMenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const ContextMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 120px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const ContextMenuItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }
`;

const PostContent = styled.div`
  margin-bottom: 15px;
  line-height: 1.5;
  white-space: pre-line;
`;

const PostImages = styled.div<{ $singleImage?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $singleImage }) => $singleImage ? '1fr' : 'repeat(2, 1fr)'};
  gap: 8px;
  margin-bottom: 15px;
  max-width: 100%;
`;

const PostImage = styled.img<{ $singleImage?: boolean }>`
  width: ${({ $singleImage }) => $singleImage ? 'auto' : '100%'};
  max-width: 100%;
  border-radius: 8px;
  object-fit: contain;
  height: auto;
  max-height: 500px;
  cursor: pointer;
  margin: 0 auto;
`;

const FilesContainer = styled.div`
  margin-bottom: 15px;
`;

const FileIcon = styled.div`
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex-grow: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const DownloadIcon = styled.div`
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: #f5f5f5;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 10px;

  &:hover {
    background: #e0e0e0;
    
    ${DownloadIcon} {
      opacity: 1;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledLikeButton = styled.button<{ $background?: string }>`
  background: ${({ $background }) => $background};
`;

const PostFooter = styled.div<{
  $dividerColor?: string;
  $actionsBackground?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid ${({ $dividerColor }) => $dividerColor};
  background: ${({ $actionsBackground }) => $actionsBackground};
`;

export default PostItem;