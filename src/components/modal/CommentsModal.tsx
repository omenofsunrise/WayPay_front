import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { formatDate } from '../../utils/dateFormatter';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import { BASE_URL } from '../../api/client';
import useBlogComment from '../../api/hooks/useBlogComment';
import type { BlogPost } from '../../api/types/blog';
import type { BlogCommentForm, BlogComment } from '../../api/types/blogComment';

interface CommentsModalProps {
  post: BlogPost;
  onClose: () => void;
  onCommentAdded?: () => void;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
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
                <AttachmentName>{file.name}</AttachmentName>
                <AttachmentSize>{formatFileSize(file.size)}</AttachmentSize>
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
              <SubmitButton onClick={handleSubmitComment}>Отправить</SubmitButton>
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
          <CommentInput
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          
          {files.length > 0 && (
            <FilesPreview>
              {files.map((file, index) => (
                <FilePreviewItem key={index}>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                  <RemoveFileButton onClick={() => handleRemoveFile(index)}>
                    ×
                  </RemoveFileButton>
                </FilePreviewItem>
              ))}
            </FilesPreview>
          )}
          
          <FormActions>
            <FileUploadButton onClick={handleFileClick}>
              <FileIcon />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                multiple
              />
            </FileUploadButton>
            
            <SubmitCommentButton 
              type="submit" 
              disabled={!newComment.trim() && files.length === 0}
            >
              Отправить
            </SubmitCommentButton>
          </FormActions>
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
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
  min-height: 80px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FilesPreview = styled.div`
  margin-bottom: 8px;
`;

const FilePreviewItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  position: relative;
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
  padding: 8px;
  color: #6b7280;
  
  &:hover {
    color: #4b5563;
  }
`;

const SubmitCommentButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #2563eb;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

export default CommentsModal;