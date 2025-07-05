// components/Blog/PostItem.tsx
import React from 'react';
import styled from 'styled-components';
import type { BlogPost } from '../../api/types/blog';
import { formatDate } from '../../utils/dateFormatter';

interface PostItemProps {
  post: BlogPost;
  onToggleLike: (postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onToggleLike }) => {
  return (
    <PostItemContainer>
      <PostHeader>
        <AuthorAvatar src={post.authorPhotoPath || '/default-avatar.png'} />
        <AuthorInfo>
          <AuthorName>{post.authorFullName}</AuthorName>
          <PostDate>{formatDate(post.createdAt)}</PostDate>
        </AuthorInfo>
      </PostHeader>
      
      <PostContent>
        <p>{post.content}</p>
      </PostContent>
      
      {post.images.length > 0 && (
        <PostImages>
          {post.images.map((image, index) => (
            <PostImage 
              key={index} 
              src={image} 
              alt={`Post image ${index + 1}`} 
            />
          ))}
        </PostImages>
      )}
      
      <PostFooter>
        <LikeButton 
          onClick={() => onToggleLike(post.id)}
          $isLiked={post.isLiked}
        >
          ♥ {post.likesCount}
        </LikeButton>
        
        <CommentCount>
          💬 {post.commentsCount}
        </CommentCount>
      </PostFooter>
    </PostItemContainer>
  );
};

const PostItemContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const AuthorAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
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

const PostContent = styled.div`
  margin-bottom: 15px;
  line-height: 1.5;
`;

const PostImages = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 15px;
`;

const PostImage = styled.img`
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  height: 200px;
`;

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #E5E7EB;
  padding-top: 15px;
`;

const LikeButton = styled.button<{ $isLiked: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $isLiked }) => $isLiked ? '#EF4444' : '#6B7280'};
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.2s;

  &:hover {
    background: #F3F4F6;
  }
`;

const CommentCount = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6B7280;
  font-size: 14px;
`;

export default PostItem;