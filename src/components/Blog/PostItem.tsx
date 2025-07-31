import React, { useState } from 'react';
import styled from 'styled-components';
import type { BlogPost, FileAttachment } from '../../api/types/blog';
import { formatDate } from '../../utils/dateFormatter';
import { BASE_URL } from '../../api/client';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import PhotoViewerModal from '../modal/PhotoViewerModal';
import CommentsModal from '../modal/CommentsModal';
import { LikeButton, CommentButton, ShareButton } from '../ui/Buttons/SocialButtons';

interface PostItemProps {
  post: BlogPost;
  onToggleLike: (postId: number) => void;
  onDeletePost?: (postId: number) => void;
  onEditPost?: (postId: number) => void;
  onAvatarClick?: (id: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onToggleLike, onDeletePost, onAvatarClick }) => {
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const avatarSrc = post.authorAvatarPath 
    ? BASE_URL + post.authorAvatarPath 
    : generateAvatar(getInitials(post.authorName));

  const handleFileDownload = (file: FileAttachment) => {
    const link = document.createElement('a');
    link.href = SOCIAL_BASE_URL + file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <PostItemContainer>
      <PostHeader>
        <AuthorInfoContainer>
          <AuthorAvatar 
          src={avatarSrc} 
          alt={post.authorName}
          onClick={() => onAvatarClick && onAvatarClick(post.authorId)}
          style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}/>
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
      
      <PostFooter>
        <LikeButton 
          isLiked={post.isLikedByCurrentUser} 
          count={post.likesCount} 
          onClick={() => onToggleLike(post.id)} 
        />
        
        <CommentButton 
          count={post.commentsCount} 
          onClick={handleCommentsClick} 
        />
        
        <ShareButton onClick={() => {}} />
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
          onCommentAdded={() => {
          }}
        />
      )}
    </PostItemContainer>
  );
};

const PostItemContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 10px 0;
  border: 1px solid rgba(209, 213, 219, 1);
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

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #eee;
`;

const ActionButton = styled.button<{ $isLiked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $isLiked }) => $isLiked ? '#EF4444' : '#50555C'};
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.2s;
  outline: none;

  &:hover {
    background: #F3F4F6;
  }

  &:focus {
    outline: none;
  }
`;

const ActionLabel = styled.span`
  font-size: 14px;
`;

const LikeIcon = styled.span<{ $isLiked: boolean }>`
  display: inline-block;
  width: 19px;
  height: 17px;
  background-color: ${({ $isLiked }) => $isLiked ? '#EF4444' : '#50555C'};
  mask-image: url("data:image/svg+xml,%3Csvg width='19' height='17' viewBox='0 0 19 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.44783 2.45625C3.30533 -0.149999 7.17721 -0.152499 9.03908 2.45125L9.32971 2.8575L9.59033 2.48688C11.4372 -0.134999 15.3153 -0.160624 17.1966 2.43625C17.8322 3.31349 18.1434 4.38424 18.0771 5.4655C18.0107 6.54676 17.5709 7.57142 16.8328 8.36438L9.79033 15.9256C9.73185 15.9885 9.66104 16.0386 9.58232 16.0729C9.50361 16.1071 9.41868 16.1248 9.33284 16.1248C9.24699 16.1248 9.16206 16.1071 9.08334 16.0729C9.00463 16.0386 8.93382 15.9885 8.87533 15.9256L1.82783 8.3375C1.09696 7.55086 0.659995 6.53606 0.590761 5.46453C0.521527 4.39299 0.824264 3.3304 1.44783 2.45625ZM8.02283 3.17813C6.65971 1.27188 3.82533 1.27438 2.46533 3.1825C2.00906 3.82235 1.78761 4.60008 1.8384 5.38431C1.88918 6.16855 2.20909 6.91122 2.74408 7.48688L9.33409 14.5813L15.9178 7.5125C16.4588 6.93157 16.7812 6.18077 16.8299 5.38846C16.8785 4.59615 16.6505 3.81154 16.1847 3.16875C14.8066 1.26625 11.9653 1.28563 10.6122 3.20625L9.84409 4.29625C9.7866 4.37773 9.71046 4.44428 9.62202 4.49033C9.53357 4.53638 9.43539 4.5606 9.33568 4.56097C9.23596 4.56133 9.13761 4.53784 9.04883 4.49244C8.96004 4.44704 8.88341 4.38106 8.82533 4.3L8.02283 3.17813Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const CommentIcon = styled.span`
  display: inline-block;
  width: 17px;
  height: 17px;
  background-color: #50555C;
  mask-image: url("data:image/svg+xml,%3Csvg width='17' height='17' viewBox='0 0 17 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.87532 13C2.15703 13 1.46816 12.7147 0.960244 12.2067C0.452333 11.6988 0.166992 11.01 0.166992 10.2917V3.20833C0.166992 2.49004 0.452333 1.80116 0.960244 1.29325C1.46816 0.785341 2.15703 0.5 2.87532 0.5H14.1253C14.481 0.5 14.8332 0.570053 15.1618 0.70616C15.4903 0.842266 15.7889 1.04176 16.0404 1.29325C16.2919 1.54474 16.4914 1.84331 16.6275 2.1719C16.7636 2.50049 16.8337 2.85267 16.8337 3.20833V10.2917C16.8337 10.6473 16.7636 10.9995 16.6275 11.3281C16.4914 11.6567 16.2919 11.9553 16.0404 12.2067C15.7889 12.4582 15.4903 12.6577 15.1618 12.7938C14.8332 12.9299 14.481 13 14.1253 13H9.34366L5.16699 16.125C5.01223 16.2408 4.82829 16.3113 4.63575 16.3286C4.44321 16.3458 4.24967 16.3091 4.07679 16.2226C3.90391 16.1362 3.7585 16.0033 3.65684 15.8389C3.55518 15.6744 3.50127 15.485 3.50116 15.2917V13H2.87532ZM8.92866 11.75H14.1253C14.5121 11.75 14.883 11.5964 15.1565 11.3229C15.43 11.0494 15.5837 10.6784 15.5837 10.2917V3.20833C15.5837 2.82156 15.43 2.45063 15.1565 2.17714C14.883 1.90365 14.5121 1.75 14.1253 1.75H2.87532C2.48855 1.75 2.11762 1.90365 1.84413 2.17714C1.57064 2.45063 1.41699 2.82156 1.41699 3.20833V10.2917C1.41699 11.0967 2.07033 11.75 2.87532 11.75H4.74949V14.875L8.92866 11.75Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const ShareIcon = styled.span`
  display: inline-block;
  width: 15px;
  height: 14px;
  background-color: #50555C;
  mask-image: url("data:image/svg+xml,%3Csvg width='15' height='14' viewBox='0 0 15 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.16603 2.50216C9.16599 1.91022 9.37583 1.33743 9.75826 0.885601C10.1407 0.43377 10.6709 0.132162 11.2547 0.0343785C11.8385 -0.0634049 12.4381 0.0489702 12.9469 0.351533C13.4557 0.654095 13.8407 1.12725 14.0335 1.6869C14.2264 2.24655 14.2146 2.85645 14.0002 3.4082C13.7858 3.95995 13.3827 4.41782 12.8626 4.70044C12.3424 4.98305 11.739 5.0721 11.1594 4.95176C10.5798 4.83141 10.0617 4.50948 9.69703 4.04316L5.08103 6.35116C5.19513 6.77597 5.19513 7.22336 5.08103 7.64816L9.69903 9.95816C10.0818 9.47098 10.6318 9.14326 11.2424 9.03854C11.853 8.93382 12.4808 9.05956 13.0039 9.39139C13.5271 9.72321 13.9085 10.2375 14.074 10.8345C14.2396 11.4315 14.1776 12.0687 13.9 12.6226C13.6224 13.1765 13.1491 13.6076 12.5718 13.8323C11.9944 14.057 11.3542 14.0594 10.7752 13.8389C10.1962 13.6184 9.71976 13.1908 9.43814 12.6389C9.15653 12.0871 9.08985 11.4504 9.25103 10.8522L4.63303 8.54216C4.31204 8.95136 3.87142 9.25027 3.37254 9.39725C2.87366 9.54423 2.34136 9.53196 1.84979 9.36216C1.35821 9.19236 0.931823 8.87348 0.630018 8.44992C0.328213 8.02637 0.166016 7.51924 0.166016 6.99916C0.166016 6.47908 0.328213 5.97195 0.630018 5.5484C0.931823 5.12485 1.35821 4.80596 1.84979 4.63616C2.34136 4.46636 2.87366 4.45409 3.37254 4.60107C3.87142 4.74805 4.31204 5.04696 4.63303 5.45616L9.25103 3.14916C9.19455 2.93813 9.16597 2.72062 9.16603 2.50216ZM11.668 1.00016C11.2698 1.00016 10.8879 1.15835 10.6063 1.43994C10.3247 1.72153 10.1665 2.10344 10.1665 2.50166C10.1665 2.89988 10.3247 3.2818 10.6063 3.56338C10.8879 3.84497 11.2698 4.00316 11.668 4.00316C12.0663 4.00316 12.4482 3.84497 12.7298 3.56338C13.0113 3.2818 13.1695 2.89988 13.1695 2.50166C13.1695 2.10344 13.0113 1.72153 12.7298 1.43994C12.4482 1.15835 12.0663 1.00016 11.668 1.00016ZM11.666 10.0002C11.2682 10.0002 10.8867 10.1582 10.6054 10.4395C10.3241 10.7208 10.166 11.1023 10.166 11.5002C10.166 11.898 10.3241 12.2795 10.6054 12.5608C10.8867 12.8421 11.2682 13.0002 11.666 13.0002C12.0639 13.0002 12.4454 12.8421 12.7267 12.5608C13.008 12.2795 13.166 11.898 13.166 11.5002C13.166 11.1023 13.008 10.7208 12.7267 10.4395C12.4454 10.1582 12.0639 10.0002 11.666 10.0002ZM1.16603 7.00016C1.16603 7.19714 1.20483 7.3922 1.28021 7.57419C1.35559 7.75617 1.46608 7.92153 1.60537 8.06082C1.74466 8.20011 1.91002 8.3106 2.09201 8.38598C2.27399 8.46136 2.46905 8.50016 2.66603 8.50016C2.86301 8.50016 3.05807 8.46136 3.24006 8.38598C3.42204 8.3106 3.5874 8.20011 3.72669 8.06082C3.86598 7.92153 3.97647 7.75617 4.05185 7.57419C4.12723 7.3922 4.16603 7.19714 4.16603 7.00016C4.16603 6.60234 4.008 6.22081 3.72669 5.9395C3.44539 5.6582 3.06386 5.50016 2.66603 5.50016C2.26821 5.50016 1.88668 5.6582 1.60537 5.9395C1.32407 6.22081 1.16603 6.60234 1.16603 7.00016Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

export default PostItem;