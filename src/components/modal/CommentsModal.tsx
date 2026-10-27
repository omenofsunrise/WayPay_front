import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { formatDate } from '../../utils/dateFormatter';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import { FILE_BASE_URL } from '../../api/client';
import useBlogComment from '../../api/hooks/useBlogComment';
import type { BlogPost } from '../../api/types/blog';
import type { BlogCommentForm, BlogComment } from '../../api/types/blogComment';
import { useEmployee } from '../../api/hooks/useEmployee';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import PhotoViewerModal from './PhotoViewerModal';
import { LikeButton } from '../ui/Buttons/SocialButtons';
import FileItem from '../Blog/FileItem';
import BaseModal from './BASE/modalCRUBase';

interface CommentsModalProps {
  post: BlogPost;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CommentsModal: React.FC<CommentsModalProps> = ({ post, onClose, onCommentAdded }) => {
  const { 
    comments, 
    isLoading, 
    error, 
    getCommentsByPost, 
    createComment, 
    updateCommentText,
    toggleLike, 
    deleteComment 
  } = useBlogComment();
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { authInfo } = useEmployee();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [cachedComments, setCachedComments] = useState<BlogComment[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    const freshComments = await getCommentsByPost(post.id);
    if (freshComments) {
      setCachedComments(freshComments);
    }
  }, [post.id, getCommentsByPost]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (replyingTo || editingCommentId) {
      commentInputRef.current?.focus();
    }
  }, [replyingTo, editingCommentId]);

  const handleEditSubmit = async () => {
    if (!newComment.trim() || !editingCommentId) return;

    await updateCommentText(editingCommentId, newComment);
    
    setEditingCommentId(null);
    setNewComment('');
    loadComments();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCommentId) {
      await handleEditSubmit();
      return;
    }

    if (!newComment.trim() && files.length === 0) return;

    const commentData: BlogCommentForm = {
      postId: post.id,
      content: newComment,
      attachments: files,
    };

    if (replyingTo) {
      commentData.parentId = replyingTo;
    }

    const createdComment = await createComment(commentData);
    if (createdComment) {
      setNewComment('');
      setFiles([]);
      setReplyingTo(null);
      loadComments();
      if (onCommentAdded) onCommentAdded();
    }
  };

  const handleLikeClick = async (commentId: number) => {
    const updateCommentLikes = (comments: BlogComment[]): BlogComment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const newLikeCount = comment.isLikedByCurrentUser 
            ? comment.likeCount - 1 
            : comment.likeCount + 1;
          
          return {
            ...comment,
            isLikedByCurrentUser: !comment.isLikedByCurrentUser,
            likeCount: newLikeCount
          };
        }
        
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies)
          };
        }
        
        return comment;
      });
    };

    setCachedComments(prev => updateCommentLikes(prev));

    try {
      await toggleLike(commentId);
      loadComments();
    } catch (error) {
      setCachedComments(prev => updateCommentLikes(prev));
      console.error('Ошибка при обновлении лайка:', error);
    }
  };

  const handleStartReply = (commentId: number) => {
    setReplyingTo(commentId);
    setEditingCommentId(null);
    setNewComment(replyTexts[commentId] || '');
  };

  const handleCancelReply = () => {
    if (replyingTo) {
      setReplyTexts(prev => ({
        ...prev,
        [replyingTo]: newComment
      }));
    }
    setReplyingTo(null);
    setNewComment('');
  };

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`Файл "${file.name}" превышает максимальный размер 10MB`);
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files) {
      if (files.length >= 1) {
        setErrorMessage("Можно прикрепить только один файл");
        return;
      }
      
      const newFiles = Array.from(e.target.files).filter(file => {
        if (!file.type.startsWith('image/')) {
          setErrorMessage(`Файл "${file.name}" не является изображением`);
          return false;
        }
        return validateFile(file);
      });
      
      setFiles(prev => [...prev, ...newFiles.slice(0, 1 - prev.length)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files) {
      if (files.length >= 1) {
        setErrorMessage("Можно прикрепить только один файл");
        return;
      }
      
      const newFiles = Array.from(e.target.files).filter(file => {
        if (file.type.startsWith('image/')) {
          setErrorMessage(`Для загрузки изображений используйте кнопку "Фото"`);
          return false;
        }
        return validateFile(file);
      });
      
      setFiles(prev => [...prev, ...newFiles.slice(0, 1 - prev.length)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setCachedComments(prev => 
        prev.filter(comment => comment.id !== commentId)
          .map(comment => {
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== commentId)
              };
            }
            return comment;
          })
      );

      await deleteComment(commentId);
      loadComments();
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      loadComments();
    }
  };

  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const openImageViewer = (images: string[], index: number) => {
    setViewingImages(images);
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  const renderComments = (commentsList: BlogComment[], level = 0) => {
    return commentsList.map(comment => (
      <CommentContainer key={comment.id} $level={level}>
        <CommentHeader>
          <AuthorAvatar 
            src={comment.authorPhotoPath 
              ? FILE_BASE_URL + comment.authorPhotoPath 
              : generateAvatar(getInitials(comment.authorName))} 
            alt={comment.authorName}
          />
          <CommentAuthor>{comment.authorName}</CommentAuthor>
          <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
          
          {authInfo?.employee.id === comment.authorId && (
            <CommentActions>
              <MenuButton>
                <svg width="17" height="4" viewBox="0 0 17 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.95486 0.119141C0.920509 0.119141 0.0742188 0.965431 0.0742188 1.99979C0.0742188 3.03414 0.920509 3.88043 1.95486 3.88043C2.98922 3.88043 3.83551 3.03414 3.83551 1.99979C3.83551 0.965431 2.98922 0.119141 1.95486 0.119141ZM15.1194 0.119141C14.085 0.119141 13.2387 0.965431 13.2387 1.99979C13.2387 3.03414 14.085 3.88043 15.1194 3.88043C16.1537 3.88043 17 3.03414 17 1.99979C17 0.965431 16.1537 0.119141 15.1194 0.119141ZM8.53712 0.119141C7.50277 0.119141 6.65648 0.965431 6.65648 1.99979C6.65648 3.03414 7.50277 3.88043 8.53712 3.88043C9.57148 3.88043 10.4178 3.03414 10.4178 1.99979C10.4178 0.965431 9.57148 0.119141 8.53712 0.119141Z" fill="#50555C"/>
                </svg>
                <MenuDropdown>
                  <MenuItem onClick={() => {
                    setEditingCommentId(comment.id);
                    setNewComment(comment.content);
                    setReplyingTo(null);
                  }}>Изменить</MenuItem>
                  <MenuItem onClick={() => handleDeleteComment(comment.id)}>Удалить</MenuItem>
                </MenuDropdown>
              </MenuButton>
            </CommentActions>
          )}
        </CommentHeader>
        
        <CommentContent>{comment.content}</CommentContent>
        
        {comment.attachments.length > 0 && (
          <AttachmentsContainer>
            {comment.attachments.map((file, index) => (
              file.isImage ? (
                <ImagePreviewWrapper key={index}>
                  <ImagePreview 
                    src={SOCIAL_BASE_URL + file.filePath} 
                    alt={`Прикрепленное изображение ${index + 1}`}
                    onClick={() => openImageViewer(
                      comment.attachments.filter(a => a.isImage).map(a => SOCIAL_BASE_URL + a.filePath),
                      comment.attachments.filter(a => a.isImage).findIndex(a => a.filePath === file.filePath)
                    )}
                  />
                </ImagePreviewWrapper>
              ) : (
                <FileItem
                  key={index}
                  file={new File([], file.fileName, { type: file.isImage ? 'image/jpeg' : 'application/octet-stream' })}
                  onPreview={() => {
                    if (file.isImage) {
                      openImageViewer(
                        comment.attachments.filter(a => a.isImage).map(a => SOCIAL_BASE_URL + a.filePath),
                        comment.attachments.filter(a => a.isImage).findIndex(a => a.filePath === file.filePath)
                      );
                    }
                    else {
                      window.open(SOCIAL_BASE_URL + file.filePath, '_blank');
                    }
                  }}
                  showRemoveButton={false}
                />
              )
            ))}
          </AttachmentsContainer>
        )}
        
        <CommentFooter>
          <LikeButton 
            isLiked={comment.isLikedByCurrentUser}
            count={comment.likeCount}
            onClick={() => handleLikeClick(comment.id)}
          />
          
          <ReplyButton onClick={() => handleStartReply(comment.id)}>
            Ответить
          </ReplyButton>
        </CommentFooter>
        
        {comment.replies && comment.replies.length > 0 && (
          <RepliesContainer>
            {renderComments(comment.replies, level + 1)}
          </RepliesContainer>
        )}
      </CommentContainer>
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
  };

  return (
    <>
      <BaseModal
        title="Комментарии"
        subtitle="Обсуждение публикации"
        appearance="compact-form"
        width="680px"
        maxHeight="calc(100vh - 32px)"
        onClose={onClose}
        onCancel={onClose}
        hideSaveButton
        hideCanselButton
      >
        <ModalContent>
          <CommentsList ref={commentsListRef}>
            {isLoading && cachedComments.length === 0 ? (
              <LoadingText>Загрузка комментариев...</LoadingText>
            ) : error ? (
              <ErrorText>Ошибка загрузки комментариев</ErrorText>
            ) : cachedComments.length > 0 ? (
              <>
                {renderComments(cachedComments)}
                <div ref={commentsEndRef} />
              </>
            ) : (
              <NoCommentsText>Напишите первый комментарий</NoCommentsText>
            )}
          </CommentsList>
          
          <NewCommentForm onSubmit={handleSubmitComment}>
            <CommentInputContainer>
              <AuthorAvatar 
                src={authInfo?.employee.photoPath 
                  ? FILE_BASE_URL + authInfo.employee.photoPath 
                  : generateAvatar(getInitials(authInfo?.employee.fullName || 'U'))} 
                alt={authInfo?.employee.fullName || 'User'}
              />
              <InputWrapper>
                <CommentInput
                  ref={commentInputRef}
                  placeholder={
                    editingCommentId ? "Редактируйте комментарий..." : 
                    replyingTo ? "Напишите ответ..." : 
                    "Напишите комментарий..."
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <ActionButtons>
                  {(replyingTo || editingCommentId) && (
                    <CancelEditButton type="button" onClick={handleCancelReply}>
                      <CloseIcon />
                    </CancelEditButton>
                  )}
                  <FileButton type="button" onClick={handleImageClick}>
                    <PhotoIcon />
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                      multiple
                    />
                  </FileButton>
                  <FileButton type="button" onClick={handleFileClick}>
                    <FileIconSvg />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      multiple
                    />
                  </FileButton>
                  <SubmitButton 
                    type="submit" 
                    disabled={(!newComment || !newComment.trim()) && files.length === 0}
                  >
                    <SendIcon />
                  </SubmitButton>
                </ActionButtons>
              </InputWrapper>
            </CommentInputContainer>
            
            {(files.length > 0 || errorMessage) && (
              <FilesSection>
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                {files.map((file, index) => (
                  <FileItem
                    key={index}
                    file={file}
                    onRemove={() => handleRemoveFile(index)}
                    onPreview={() => {
                      if (file.type.startsWith('image/')) {
                        openImageViewer(
                          files.filter(f => f.type.startsWith('image/')).map(f => URL.createObjectURL(f)),
                          files.filter(f => f.type.startsWith('image/')).findIndex(f => f.name === file.name)
                        );
                      }
                    }}
                    showRemoveButton={true}
                  />
                ))}
              </FilesSection>
            )}
          </NewCommentForm>
        </ModalContent>
      </BaseModal>

      {isViewerOpen && (
        <PhotoViewerModal
          images={viewingImages}
          initialIndex={currentImageIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
};


const ModalContent = styled.div`
  display: flex;
  min-height: 0;
  height: min(680px, calc(100vh - 145px));
  flex-direction: column;
  overflow: hidden;
`;

const CancelEditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #6b7280;
  font-size: 12px;
  margin-right: auto;
  
  &:hover {
    color: #4b5563;
  }
`;

const SaveIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15.8333 5L7.49996 13.3333L4.16663 10' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const CommentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #6b7280;
`;

const ErrorText = styled.p`
  text-align: center;
  color: #ef4444;
`;

const NoCommentsText = styled.p`
  text-align: center;
  color: #6b7280;
`;

const CloseIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 2px;
    background-color: currentColor;
  }
  
  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }
  
  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
`;

const CommentContainer = styled.div<{ $level: number }>`
  margin-bottom: 16px;
  padding-left: ${({ $level }) => $level > 0 ? '16px' : '0'};
  border-left: ${({ $level }) => $level > 0 ? '2px solid #e5e7eb' : 'none'};
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const AuthorAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  font-size: 14px;
  margin-right: 8px;
`;

const CommentDate = styled.span`
  color: #6b7280;
  font-size: 12px;
`;

const CommentActions = styled.div`
  margin-left: auto;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  
  &:hover {
    color: #ef4444;
  }
`;

const DeleteIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 12.6667C4 13.4 4.6 14 5.33333 14H10.6667C11.4 14 12 13.4 12 12.6667V4.66667H4V12.6667ZM12.6667 2.66667H10.3333L9.66667 2H6.33333L5.66667 2.66667H3.33333V4H12.6667V2.66667Z' fill='%236B7280'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const CommentContent = styled.p`
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
`;

const AttachmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const ImagePreviewWrapper = styled.div`
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const ImagePreview = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FileAttachmentName = styled.span`
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
`;

const MenuButton = styled.div`
  position: relative;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: none;
  
  ${MenuButton}:hover & {
    display: block;
  }
`;

const MenuItem = styled.div`
  padding: 8px 16px;
  font-size: 14px;
  color: #50555C;
  white-space: nowrap;
  
  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
`;

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
  margin-left: 0;
  padding-left: 0;
`;

const LikeIcon = styled.span<{ $isLiked: boolean }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.00016 13.3333L7.06016 12.4533C3.50016 9.17333 1.3335 7.07333 1.3335 4.66667C1.3335 2.65333 2.98683 1 5.00016 1C6.06016 1 7.0735 1.45333 7.8335 2.21333L8.00016 2.38L8.16683 2.21333C8.92683 1.45333 9.94016 1 11.0002 1C13.0135 1 14.6668 2.65333 14.6668 4.66667C14.6668 7.07333 12.5002 9.17333 8.94016 12.4533L8.00016 13.3333Z' fill='%236B7280'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const LikeCount = styled.span`
  margin-left: 4px;
`;

const ReplyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #6b7280;
  font-size: 12px;
  
  &:hover {
    color: #4b5563;
  }
`;

const RepliesContainer = styled.div`
  margin-top: 16px;
`;

const ReplyForm = styled.div`
  margin-top: 8px;
`;

const ReplyInput = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
  min-height: 60px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ReplyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const FileButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  
  &:hover {
    color: #4b5563;
  }
`;

const FileIconSvg = () => (
  <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 4.9996L5.58603 13.5856C5.21088 13.9608 5.00012 14.4696 5.00012 15.0001C5.00012 15.5306 5.21088 16.0395 5.58603 16.4146C5.96118 16.7898 6.46999 17.0005 7.00053 17.0005C7.53107 17.0005 8.03988 16.7898 8.41503 16.4146L16.829 7.8286C17.5792 7.07844 18.0006 6.061 18.0006 5.0001C18.0006 3.93921 17.5792 2.92177 16.829 2.1716C16.0789 1.42144 15.0614 1 14.0005 1C12.9396 1 11.9222 1.42144 11.172 2.1716L2.79303 10.7226C2.22843 11.2781 1.77939 11.9399 1.47183 12.6697C1.16426 13.3996 1.00425 14.1832 1.00103 14.9752C0.997801 15.7673 1.15143 16.5521 1.45304 17.2845C1.75465 18.0168 2.19828 18.6822 2.75834 19.2423C3.3184 19.8024 3.9838 20.246 4.71617 20.5476C5.44854 20.8492 6.23337 21.0028 7.02541 20.9996C7.81745 20.9964 8.60101 20.8364 9.33089 20.5288C10.0608 20.2212 10.7226 19.7722 11.278 19.2076L19.657 10.6566" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

const SubmitButton = styled.button`
  color: rgba(0, 125, 136, 1);
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  background-color: transparent;

  &:hover {
    color: rgba(0, 125, 136, 1)
  }
  
  &:disabled {
    cursor: not-allowed;
    color: rgba(173, 179, 188, 1);
  }
`;

const NewCommentForm = styled.form`
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  display: flex;
  flex-direction: column;
`;

const CommentInputWrapper = styled.div`
  flex: 1;
  display: flex;
  width: 100%;
  background: black;
`;

const FilesPreview = styled.div`
  margin-top: 8px;
`;

const FilePreviewItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const FileName = styled.span`
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const FileSize = styled.span`
  color: #6b7280;
  margin-right: 8px;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  padding: 0 4px;
  
  &:hover {
    color: #ef4444;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FileUploadButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #73777D;
  
  &:hover {
    color: #4b5563;
  }
`;

const ImageUploadButton = styled(FileUploadButton)`
  /* Additional styles if needed */
`;

const SubmitCommentButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #ADB3BC;
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &:not(:disabled):hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const CommentInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  max-height: 30px;
`;

const CommentInput = styled.input`
  flex: 1;
  background: transparent;
  outline: none;
  font-size: 14px;
  padding: 4px 0;
  color: black;
  border: none;
`;

const FilesSection = styled.div`
  margin-top: 8px;
  width: 100%;
`;

const FileInfo = styled.div`
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
`;

const PhotoIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18.33 15.657C18.44 15.291 18.5 14.902 18.5 14.5V5.5C18.5 4.43913 18.0786 3.42172 17.3284 2.67157C16.5783 1.92143 15.5609 1.5 14.5 1.5H5.5C4.43913 1.5 3.42172 1.92143 2.67157 2.67157C1.92143 3.42172 1.5 4.43913 1.5 5.5V14.57C1.51835 15.6187 1.94787 16.6182 2.69604 17.3533C3.4442 18.0884 4.45115 18.5002 5.5 18.5H14.5L14.617 18.498M18.33 15.657L18.242 15.553L15.776 12.577C15.5889 12.3513 15.3544 12.1694 15.0892 12.0443C14.824 11.9193 14.5346 11.8541 14.2414 11.8533C13.9482 11.8525 13.6584 11.9162 13.3925 12.0399C13.1267 12.1636 12.8913 12.3442 12.703 12.569L11.391 14.135L11.177 14.396M18.33 15.657C18.0874 16.4603 17.5984 17.166 16.932 17.676C16.2657 18.1861 15.4558 18.4736 14.617 18.498M11.177 14.396L14.524 18.392L14.617 18.498M11.177 14.396L7.95 10.543C7.76228 10.319 7.52774 10.1388 7.26288 10.0152C6.99802 9.89155 6.70929 9.82749 6.417 9.82749C6.12471 9.82749 5.83598 9.89155 5.57112 10.0152C5.30626 10.1388 5.07172 10.319 4.884 10.543L1.678 14.37L1.501 14.571' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M13.0918 8.4082C13.9202 8.4082 14.5918 7.73663 14.5918 6.9082C14.5918 6.07978 13.9202 5.4082 13.0918 5.4082C12.2634 5.4082 11.5918 6.07978 11.5918 6.9082C11.5918 7.73663 12.2634 8.4082 13.0918 8.4082Z' fill='currentColor'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const SendIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.63109 0.122078C0.737594 -0.324422 -0.251406 0.528078 0.0580936 1.47758L2.06509 7.63008C2.12186 7.80389 2.22519 7.95882 2.36386 8.078C2.50253 8.19719 2.67122 8.27607 2.85159 8.30608L10.7816 9.62758C11.1991 9.69758 11.1991 10.2976 10.7816 10.3676L2.85209 11.6891C2.67172 11.7191 2.50303 11.798 2.36436 11.9172C2.22569 12.0363 2.12236 12.1913 2.06559 12.3651L0.0580936 18.5211C-0.251906 19.4711 0.737594 20.3236 1.63109 19.8771L19.3781 11.0061C20.2076 10.5911 20.2076 9.40758 19.3781 8.99308L1.63109 0.122078Z' fill='currentColor'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 12px;
  margin-bottom: 8px;
`;

export default CommentsModal;
