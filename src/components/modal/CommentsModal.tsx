import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { formatDate } from '../../utils/dateFormatter';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import { BASE_URL } from '../../api/client';
import useBlogComment from '../../api/hooks/useBlogComment';
import type { BlogPost } from '../../api/types/blog';
import type { BlogCommentForm, BlogComment } from '../../api/types/blogComment';
import { useEmployee } from '../../api/hooks/useEmployee';
import CustomInput from '../ui/fields/CustomInput';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';

interface CommentsModalProps {
  post: BlogPost;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CommentsModal: React.FC<CommentsModalProps> = ({ post, onClose, onCommentAdded }) => {
  const { 
    comments, 
    isLoading, 
    error, 
    getCommentsByPost, 
    createComment, 
    toggleLike, 
    deleteComment 
  } = useBlogComment();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { authInfo } = useEmployee();

  useEffect(() => {
    getCommentsByPost(post.id);
  }, [post.id, getCommentsByPost]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (onCommentAdded) onCommentAdded();
    }
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
      const newFiles = Array.from(e.target.files).filter(file => {
        if (!file.type.startsWith('image/')) {
          setErrorMessage(`Файл "${file.name}" не является изображением`);
          return false;
        }
        return validateFile(file);
      });
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => {
        if (file.type.startsWith('image/')) {
          setErrorMessage(`Для загрузки изображений используйте кнопку "Фото"`);
          return false;
        }
        return validateFile(file);
      });
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setErrorMessage(null);
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

  const renderComments = (commentsList: BlogComment[], level = 0) => {
    return commentsList.map(comment => (
      <CommentContainer key={comment.id} $level={level}>
        <CommentHeader>
          <AuthorAvatar 
            src={comment.authorAvatarPath 
              ? BASE_URL + comment.authorAvatarPath 
              : generateAvatar(getInitials(comment.authorName))} 
            alt={comment.authorName}
          />
          <CommentAuthor>{comment.authorName}</CommentAuthor>
          <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
          
          {comment.isAuthor && (
            <CommentActions>
              <ActionButton onClick={() => deleteComment(comment.id)}>
                <DeleteIcon />
              </ActionButton>
            </CommentActions>
          )}
        </CommentHeader>
        
        <CommentContent>{comment.content}</CommentContent>
        
        {comment.attachments.length > 0 && (
          <AttachmentsContainer>
            {comment.attachments.map((file, index) => (
              <AttachmentItem key={index}>
                {file.isImage ? (
                  <ImagePreview src={SOCIAL_BASE_URL + file.filePath} alt={`Прикрепленное изображение ${index + 1}`} />
                ) : (
                  <FileIcon />
                )}
                <RemoveAttachmentButton onClick={() => handleRemoveFile(index)}>
                  ×
                </RemoveAttachmentButton>
              </AttachmentItem>
            ))}
          </AttachmentsContainer>
        )}
        
        <CommentFooter>
          <LikeButton 
            onClick={() => toggleLike(comment.id)}
            $isLiked={comment.isLikedByCurrentUser}
          >
            <LikeIcon $isLiked={comment.isLikedByCurrentUser} />
            {comment.likesCount > 0 && <LikeCount>{comment.likesCount}</LikeCount>}
          </LikeButton>
          
          <ReplyButton onClick={() => setReplyingTo(comment.id)}>
            Ответить
          </ReplyButton>
        </CommentFooter>
        
        {replyingTo === comment.id && (
          <ReplyForm>
            <ReplyInput
              placeholder="Напишите ответ..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <ReplyActions>
              <FileButton onClick={handleImageClick}>
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
              <FileButton onClick={handleFileClick}>
                <FileIcon />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  multiple
                />
              </FileButton>
              <SubmitButton 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() && files.length === 0}
              >
                Отправить
              </SubmitButton>
            </ReplyActions>
          </ReplyForm>
        )}
        
        {comment.replies.length > 0 && (
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Комментарии</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <CommentsList>
          {isLoading && <LoadingText>Загрузка комментариев...</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}
          {comments && comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <NoCommentsText>Нет комментариев</NoCommentsText>
          )}
        </CommentsList>
        
        <NewCommentForm onSubmit={handleSubmitComment}>
          <CommentInputContainer>
            <AuthorAvatar 
              src={authInfo?.employee.photoPath 
                ? BASE_URL + authInfo.employee.photoPath 
                : generateAvatar(getInitials(authInfo?.employee.fullName || 'U'))} 
              alt={authInfo?.employee.fullName || 'User'}
            />
            <InputWrapper>
              <CommentInput
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <ActionButtons>
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
                  <FileIcon />
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
                  disabled={!newComment.trim() && files.length === 0}
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
                <FilePreviewItem key={index}>
                  {file.type.startsWith('image/') ? (
                    <ImagePreview src={URL.createObjectURL(file)} alt={`Прикрепленное изображение ${index + 1}`} />
                  ) : (
                    <FileIcon />
                  )}
                  <FileInfo>
                    <FileName>{file.name}</FileName>
                    <FileSize>{formatFileSize(file.size)}</FileSize>
                  </FileInfo>
                  <RemoveFileButton onClick={() => handleRemoveFile(index)}>
                    ×
                  </RemoveFileButton>
                </FilePreviewItem>
              ))}
            </FilesSection>
          )}
        </NewCommentForm>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
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
  margin-bottom: 8px;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
`;

const AttachmentName = styled.span`
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AttachmentSize = styled.span`
  color: #6b7280;
  margin-left: auto;
`;

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

const LikeButton = styled.button<{ $isLiked: boolean }>`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: ${({ $isLiked }) => $isLiked ? '#ef4444' : '#6b7280'};
  font-size: 12px;
  
  &:hover {
    color: ${({ $isLiked }) => $isLiked ? '#dc2626' : '#4b5563'};
  }
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

const FileIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.3333 14H2.66667C2.29848 14 2 13.7015 2 13.3333V2.66667C2 2.29848 2.29848 2 2.66667 2H8L14 8V13.3333C14 13.7015 13.7015 14 13.3333 14Z' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M8 2V8H14' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const SubmitButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #2563eb;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
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
  border-radius: 4px;
  margin-bottom: 4px;
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
  background: #f3f4f6;
  border-radius: 20px;
  padding: 8px 12px;
`;

const CommentInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  padding: 4px 0;
  color: black;
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

const ImagePreview = styled.img`
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
`;

const RemoveAttachmentButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  margin-left: 8px;
  
  &:hover {
    color: #ef4444;
  }
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