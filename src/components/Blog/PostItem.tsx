import React from 'react';
import styled from 'styled-components';
import type { BlogPost } from '../../api/types/blog';
import { formatDate } from '../../utils/dateFormatter';
import { BASE_URL } from '../../api/client';

interface PostItemProps {
  post: BlogPost;
  onToggleLike: (postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onToggleLike }) => {
  return (
    <PostItemContainer>
      <PostHeader>
        <AuthorAvatar src={post.authorPhotoPath}/>
        <AuthorInfo>
          <AuthorName>{post.authorName}</AuthorName>
          <PostDate>{formatDate(post.createdAt)}</PostDate>
        </AuthorInfo>
      </PostHeader>
      
      <PostContent>
        <p>{post.content}</p>
      </PostContent>
      
      {post.images && post.images.length > 0 && (
        <PostImages>
          {post.images.map((image, index) => (
            <PostImage 
              key={index} 
              src={BASE_URL + image} 
              alt={`Post image ${index + 1}`} 
            />
          ))}
        </PostImages>
      )}
      
      <PostFooter>
        <LikeButton 
          onClick={() => onToggleLike(post.id)}
          $isLiked={post.isLikedByCurrentUser}
        >
          <LikeIcon $isLiked={post.isLikedByCurrentUser} />
          {post.likesCount}
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
  margin: 20px 0;
  border: 1px solid rgba(209, 213, 219, 1);
  color: black;
  text-align: left;
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
  padding-top: 15px;
`;

const LikeButton = styled.button<{ $isLiked: boolean }>`
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

const LikeIcon = styled.span<{ $isLiked: boolean }>`
  display: inline-block;
  width: 19px;
  height: 17px;
  background-color: ${({ $isLiked }) => $isLiked ? '#EF4444' : '#50555C'};
  mask-image: url("data:image/svg+xml,%3Csvg width='19' height='17' viewBox='0 0 19 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.44783 2.45625C3.30533 -0.149999 7.17721 -0.152499 9.03908 2.45125L9.32971 2.8575L9.59033 2.48688C11.4372 -0.134999 15.3153 -0.160624 17.1966 2.43625C17.8322 3.31349 18.1434 4.38424 18.0771 5.4655C18.0107 6.54676 17.5709 7.57142 16.8328 8.36438L9.79033 15.9256C9.73185 15.9885 9.66104 16.0386 9.58232 16.0729C9.50361 16.1071 9.41868 16.1248 9.33284 16.1248C9.24699 16.1248 9.16206 16.1071 9.08334 16.0729C9.00463 16.0386 8.93382 15.9885 8.87533 15.9256L1.82783 8.3375C1.09696 7.55086 0.659995 6.53606 0.590761 5.46453C0.521527 4.39299 0.824264 3.3304 1.44783 2.45625ZM8.02283 3.17813C6.65971 1.27188 3.82533 1.27438 2.46533 3.1825C2.00906 3.82235 1.78761 4.60008 1.8384 5.38431C1.88918 6.16855 2.20909 6.91122 2.74408 7.48688L9.33409 14.5813L15.9178 7.5125C16.4588 6.93157 16.7812 6.18077 16.8299 5.38846C16.8785 4.59615 16.6505 3.81154 16.1847 3.16875C14.8066 1.26625 11.9653 1.28563 10.6122 3.20625L9.84409 4.29625C9.7866 4.37773 9.71046 4.44428 9.62202 4.49033C9.53357 4.53638 9.43539 4.5606 9.33568 4.56097C9.23596 4.56133 9.13761 4.53784 9.04883 4.49244C8.96004 4.44704 8.88341 4.38106 8.82533 4.3L8.02283 3.17813Z' fill='%2350555C'/%3E%3C/svg%3E");
  mask-repeat: no-repeat;
  mask-position: center;
`;

const CommentCount = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6B7280;
  font-size: 14px;
`;

export default PostItem;