import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import WhiteButton from '../ui/Buttons/WhiteButton';
import { useEmployee } from '../../api/hooks/useEmployee';
import { SOCIAL_BASE_URL } from '../../api/socialApiClient';
import { API_BASE_URL, BASE_URL } from '../../api/client';
import CustomInput from '../ui/fields/CustomInput';
import type { Profile, Employee } from '../../api/types/employee';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';
import useChat from '../../api/hooks/useChat';

interface BlogProfileProps {
  employeeId?: number;
  onAvatarClick?: (id: number) => void;
}

interface CombinedProfile extends Employee {
  description?: string;
  postCount?: number;
  commentCount?: number;
  likeCount?: number;
}

export const BlogProfile = ({ employeeId, onAvatarClick }: BlogProfileProps) => {
  const { id: paramId } = useParams();
  const profileId = employeeId || (paramId ? parseInt(paramId) : undefined);
  
  const { 
    authInfo,
    profileError,
    fetchProfile,
    updateProfile,
    fetchEmployeeById
  } = useEmployee();
  const { createPrivateChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [currentProfile, setCurrentProfile] = useState<CombinedProfile>({
    id: 0,
    fullName: '',
    photoPath: '',
    description: '',
    postCount: 0,
    commentCount: 0,
    likeCount: 0
  });
  const inputRef = useRef<HTMLInputElement>(null);
      
    useEffect(() => {
    const loadProfile = async () => {
        if (profileId) {
        const employee = await fetchEmployeeById(profileId);
        const employeeProfile = await fetchProfile(profileId);
        setCurrentProfile({
            ...employee,
            description: employeeProfile?.description || "",
            postCount: employeeProfile?.postsCount,
            commentCount: employeeProfile?.commentsCount,
            likeCount: employeeProfile?.likesCount
        });
        setDescription(employeeProfile?.description || ""); 
        } else {
        const profileData = await fetchProfile();
        if (authInfo?.employee) {
            setCurrentProfile({
            ...authInfo.employee,
            description: profileData?.description || "",
            postCount: profileData?.postsCount,
            commentCount: profileData?.commentsCount,
            likeCount: profileData?.likesCount
            });
            setDescription(profileData?.description || "");
        }
        }
    };
    
    loadProfile();
    }, [profileId, fetchProfile, fetchEmployeeById, authInfo]);

  const handleOpenUserChat = async ()=> {
    const newChat = await createPrivateChat(currentProfile.id);
    window.open(`/chat/${newChat.id}`, '_blank');
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setDescription(currentProfile?.description || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveDescription = async () => {
    try {
      await updateProfile({ description });
      const updatedProfile = await fetchProfile(profileId);
      if (currentProfile) {
        setCurrentProfile({
          ...currentProfile,
          description: updatedProfile.description
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveDescription();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleAvatarClick = () => {
    if (onAvatarClick && currentProfile.id) {
      onAvatarClick(currentProfile.id);
    }
  };

  if (profileError) {
    return <div>Ошибка загрузки профиля: {profileError}</div>;
  }

  const isOwnProfile = !profileId || profileId === authInfo?.employee.id;

  return (
    <ProfileContainer>
      <AvatarSection onClick={handleAvatarClick} style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}>
        <Avatar 
          src={currentProfile.photoPath 
            ? BASE_URL + currentProfile.photoPath 
            : generateAvatar(getInitials(currentProfile.fullName))} 
          alt="User Avatar" 
        />
      </AvatarSection>
      
      <InfoSection>
        <FullName>{currentProfile.fullName}</FullName>
        
        {isEditing ? (
          <EditContainer>
            <CustomInput
              ref={inputRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ width: '100%' }}
              onBlur={handleSaveDescription}
            />
          </EditContainer>
        ) : (
          <>
            {isOwnProfile && !employeeId && ( // Показываем только в своем профиле на главной странице
              <EditStatusButton onClick={handleEditClick}>
                <EditIcon>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 10.4999V12.9999H2.5L9.87333 5.62656L7.37333 3.12656L0 10.4999ZM12.2733 3.22656L9.77333 0.726562L8.08667 2.4199L10.5867 4.9199L12.2733 3.22656Z" fill="#50555C"/>
                  </svg>
                </EditIcon>
                <EditText>Изменить статус</EditText>
              </EditStatusButton>
            )}
            <Description>
              {currentProfile.description || 'Нет описания'}
            </Description>
          </>
        )}
      </InfoSection>
      
      <StatsSection>
        <StatsContainer>
          <StatItem>
            <StatValue>{currentProfile.postCount || 0}</StatValue>
            <StatLabel>постов</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{currentProfile.commentCount || 0}</StatValue>
            <StatLabel>комментариев</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{currentProfile.likeCount || 0}</StatValue>
            <StatLabel>реакций</StatLabel>
          </StatItem>
        </StatsContainer>
        
        {!isOwnProfile && (
          <DarkCyanButton style={{width: "100%"}} onClick={handleOpenUserChat}>
            Отправить сообщение
          </DarkCyanButton>
        )}
      </StatsSection>
    </ProfileContainer>
  );
};

const ProfileContainer = styled.div`
  display: flex;
  background-color: rgba(255, 255, 255, 1);
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  height: 120px;
  position: relative;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px;
  border-right: 1px solid rgba(209, 213, 219, 1);
  text-align: left;
  flex-grow: 1;
`;

const FullName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const Description = styled.div`
  font-size: 0.9rem;
  color: #444;
  margin-top: 5px;
`;

const EditStatusButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: #50555C;
  font-size: 0.8rem;
  margin-bottom: 4px;
  
  &:hover {
    opacity: 0.8;
  }
`;

const EditIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EditText = styled.span`
  font-size: 0.8rem;
`;

const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 5px;
`;

const StatsSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 0 20px;
  gap: 10px;
  min-width: 250px;
`;

const StatsContainer = styled.div`
  display: flex;
  margin: 0 auto;
  gap: 20px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #333;
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
`;