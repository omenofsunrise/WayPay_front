import React from 'react';
import styled from 'styled-components';

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onClick: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ isLiked, count, onClick }) => {
  return (
    <ActionButton onClick={onClick}>
      <LikeIcon $isLiked={isLiked}>
        <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M1.44783 2.45625C3.30533 -0.149999 7.17721 -0.152499 9.03908 2.45125L9.32971 2.8575L9.59033 2.48688C11.4372 -0.134999 15.3153 -0.160624 17.1966 2.43625C17.8322 3.31349 18.1434 4.38424 18.0771 5.4655C18.0107 6.54676 17.5709 7.57142 16.8328 8.36438L9.79033 15.9256C9.73185 15.9885 9.66104 16.0386 9.58232 16.0729C9.50361 16.1071 9.41868 16.1248 9.33284 16.1248C9.24699 16.1248 9.16206 16.1071 9.08334 16.0729C9.00463 16.0386 8.93382 15.9885 8.87533 15.9256L1.82783 8.3375C1.09696 7.55086 0.659995 6.53606 0.590761 5.46453C0.521527 4.39299 0.824264 3.3304 1.44783 2.45625Z" 
            fill={isLiked ? 'rgba(255, 90, 90, 1)' : 'none'}
            stroke={isLiked ? 'rgba(255, 90, 90, 1)' : '#50555C'}
            strokeWidth="1.5"
          />
        </svg>
      </LikeIcon>
      <ActionLabel>{count} Реакций</ActionLabel>
    </ActionButton>
  );
};

interface CommentButtonProps {
  count: number;
  onClick: () => void;
}

export const CommentButton: React.FC<CommentButtonProps> = ({ count, onClick }) => {
  return (
    <ActionButton onClick={onClick}>
      <CommentIcon>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.87532 13C2.15703 13 1.46816 12.7147 0.960244 12.2067C0.452333 11.6988 0.166992 11.01 0.166992 10.2917V3.20833C0.166992 2.49004 0.452333 1.80116 0.960244 1.29325C1.46816 0.785341 2.15703 0.5 2.87532 0.5H14.1253C14.481 0.5 14.8332 0.570053 15.1618 0.70616C15.4903 0.842266 15.7889 1.04176 16.0404 1.29325C16.2919 1.54474 16.4914 1.84331 16.6275 2.1719C16.7636 2.50049 16.8337 2.85267 16.8337 3.20833V10.2917C16.8337 10.6473 16.7636 10.9995 16.6275 11.3281C16.4914 11.6567 16.2919 11.9553 16.0404 12.2067C15.7889 12.4582 15.4903 12.6577 15.1618 12.7938C14.8332 12.9299 14.481 13 14.1253 13H9.34366L5.16699 16.125C5.01223 16.2408 4.82829 16.3113 4.63575 16.3286C4.44321 16.3458 4.24967 16.3091 4.07679 16.2226C3.90391 16.1362 3.7585 16.0033 3.65684 15.8389C3.55518 15.6744 3.50127 15.485 3.50116 15.2917V13H2.87532ZM8.92866 11.75H14.1253C14.5121 11.75 14.883 11.5964 15.1565 11.3229C15.43 11.0494 15.5837 10.6784 15.5837 10.2917V3.20833C15.5837 2.82156 15.43 2.45063 15.1565 2.17714C14.883 1.90365 14.5121 1.75 14.1253 1.75H2.87532C2.48855 1.75 2.11762 1.90365 1.84413 2.17714C1.57064 2.45063 1.41699 2.82156 1.41699 3.20833V10.2917C1.41699 11.0967 2.07033 11.75 2.87532 11.75H4.74949V14.875L8.92866 11.75Z" fill="#50555C"/>
        </svg>
      </CommentIcon>
      <ActionLabel>{count} Комментариев</ActionLabel>
    </ActionButton>
  );
};

// Компонент для кнопки "Поделиться"
interface ShareButtonProps {
  onClick: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  return (
    <ActionButton onClick={onClick}>
      <ShareIcon>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9L1.5 6L14.5 1.5Z"
            stroke="#50555C"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </ShareIcon>
      <ActionLabel>Поделиться</ActionLabel>
    </ActionButton>
  );
};

// Стили для компонентов
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  color: #50555C;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 17px;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const CommentIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const ShareIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 14px;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;
