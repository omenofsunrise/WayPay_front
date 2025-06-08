import React from 'react';
import styled from 'styled-components';

type AvatarProps = {
  src?: string;
  size?: number;
  name?: string;
  disabled?: boolean;
  onClick?: () => void;
  showCameraIndicator?: boolean;
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  size = 40,
  name = '',
  disabled = false,
  onClick,
  showCameraIndicator = false,
}) => {
  const getInitials = () => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.length > 0 
      ? `${parts[0][0]}${parts.length > 1 ? parts[1][0] : ''}`
      : name[0];
  };

  return (
    <ContentWrapper size={size}>
      <AvatarContainer 
        size={size} 
        onClick={!disabled ? onClick : undefined}
        title={name}
      >
        {src ? (
          <AvatarImage src={src} alt={name} />
        ) : (
          <AvatarInitials>{getInitials()}</AvatarInitials>
        )}
      </AvatarContainer>
      {showCameraIndicator && (
        <StatusIndicator size={size}>
          <CameraIcon />
        </StatusIndicator>
      )}
    </ContentWrapper>
  );
};

const ContentWrapper = styled.div<{ size: number }>`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`;

const AvatarContainer = styled.div<{ size: number }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarInitials = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #555;
`;

const StatusIndicator = styled.div<{ size: number }>`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: ${props => props.size * 0.2}px;
  height: ${props => props.size * 0.2}px;
  border-radius: 50%;
  background-color: rgba(0, 125, 136, 1);
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(25%, 25%);
`;

const CameraIcon = () => (
  <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 14.5C11.25 14.5 12.3127 14.0627 13.188 13.188C14.0633 12.3133 14.5007 11.2507 14.5 10C14.4993 8.74933 14.062 7.687 13.188 6.813C12.314 5.939 11.2513 5.50133 10 5.5C8.74867 5.49867 7.68633 5.93633 6.813 6.813C5.93967 7.68967 5.502 8.752 5.5 10C5.498 11.248 5.93567 12.3107 6.813 13.188C7.69033 14.0653 8.75267 14.5027 10 14.5ZM10 12.5C9.3 12.5 8.70833 12.2583 8.225 11.775C7.74167 11.2917 7.5 10.7 7.5 10C7.5 9.3 7.74167 8.70833 8.225 8.225C8.70833 7.74167 9.3 7.5 10 7.5C10.7 7.5 11.2917 7.74167 11.775 8.225C12.2583 8.70833 12.5 9.3 12.5 10C12.5 10.7 12.2583 11.2917 11.775 11.775C11.2917 12.2583 10.7 12.5 10 12.5ZM2 18C1.45 18 0.979333 17.8043 0.588 17.413C0.196667 17.0217 0.000666667 16.5507 0 16V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H5.15L7 0H13L14.85 2H18C18.55 2 19.021 2.196 19.413 2.588C19.805 2.98 20.0007 3.45067 20 4V16C20 16.55 19.8043 17.021 19.413 17.413C19.0217 17.805 18.5507 18.0007 18 18H2Z" fill="white"/>
  </svg>
);

export default Avatar;