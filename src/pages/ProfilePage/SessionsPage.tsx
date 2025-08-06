import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useEmployee } from '../../api/hooks/useEmployee';
import type { AuthSession } from '../../api/types/auth';
import { formatDate } from '../../utils/dateFormatter';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import { Loader } from 'react-feather';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import GrayButton from '../../components/ui/Buttons/GrayButton';

const SessionsPage = () => {
  const { 
    sessions, 
    sessionsLoading, 
    sessionsError, 
    fetchSessions, 
    revokeSession,
    revokeLoading,
    revokeError,
    revokeAllSessions
  } = useEmployee();

  const [localError, setLocalError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      await fetchSessions();
      setLocalError(null);
    } catch (err) {
      setLocalError('Не удалось загрузить сессии');
    }
  }, [fetchSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId?: number) => {
    try {
      await revokeSession(sessionId);
      await loadSessions();
    } catch (err) {
      setLocalError('Не удалось завершить сессию');
    }
  };

  const handleRevokeAllExceptCurrent = async () => {
    try {
      await revokeAllSessions();
      await loadSessions();
    } catch (err) {
      setLocalError('Не удалось завершить все сессии');
    }
  };

  const renderSessionRow = (session: AuthSession) => (
    <SessionRow key={session.id} $isCurrent={session.isCurrentSession}>
      <SessionInfo>
        <DeviceInfo>
          <strong>{session.deviceInfo}</strong>
          {session.isCurrentSession && <CurrentBadge>Текущая</CurrentBadge>}
        </DeviceInfo>
        <SessionMeta>
          <div>IP: {session.ipAddress}</div>
        </SessionMeta>
        <SessionDates>
          <div>Создана: {formatDate(session.createdAt)}</div>
          <div>Последняя активность: {formatDate(session.lastUsedAt)}</div>
          <div>Истекает: {formatDate(session.expiresAt)}</div>
        </SessionDates>
      </SessionInfo>
      <SessionActions>
        {!session.isCurrentSession ? (
          <DarkCyanButton 
            onClick={() => handleRevoke(session.id)}
            disabled={revokeLoading}
            style={{ width: '120px' }}
          >
            Завершить
          </DarkCyanButton>
        ) : (
          <DarkCyanButton
            onClick={() => handleRevoke()}
            disabled={revokeLoading}
          >
            Завершить текущую сессию
          </DarkCyanButton>
        )}
      </SessionActions>
    </SessionRow>
  );

  return (
    <PageLayout>
      <HeaderContainer>
        <TitleWrapper>
          <CustomTitle style={{ margin: 0 }}>Активные сессии</CustomTitle>
          <ModalInfoTitle>Управление активными сессиями вашего аккаунта</ModalInfoTitle>
        </TitleWrapper>
        
        <ButtonGroup>
          <GrayButton 
            onClick={loadSessions} 
            disabled={sessionsLoading}
          >
            Обновить
          </GrayButton>
        </ButtonGroup>
      </HeaderContainer>

      {sessionsLoading && <LoaderWrapper><Loader /></LoaderWrapper>}
      
      {sessionsError || localError || revokeError ? (
        <ErrorMessage>
          {sessionsError || localError || revokeError}
        </ErrorMessage>
      ) : null}

      {!sessionsLoading && sessions && (
        <SessionsList>
          {sessions.length > 0 ? (
            sessions.map(renderSessionRow)
          ) : (
            <EmptyMessage>Нет активных сессий</EmptyMessage>
          )}
        </SessionsList>
      )}
    </PageLayout>
  );
};


const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 24px;
`;

const TitleWrapper = styled.div`
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  padding: 16px;
  background-color: #fef2f2;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const SessionRow = styled.div<{ $isCurrent?: boolean }>`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${({ $isCurrent }) => $isCurrent ? 'rgba(0, 125, 136, 1)' : 'transparent'};
`;

const SessionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
`;

const CurrentBadge = styled.span`
  background-color: rgba(0, 125, 136, 0.1);
  color: rgba(0, 125, 136, 1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const SessionMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
`;

const SessionDates = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #9ca3af;
`;

const SessionActions = styled.div`
  margin-left: 20px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 14px;
  background-color: white;
  border-radius: 8px;
`;

export default SessionsPage;