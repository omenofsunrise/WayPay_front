import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useEmployee } from '../../api/hooks/useEmployee';
import type { AuthSession } from '../../api/types/auth';
import { formatDate } from '../../utils/dateFormatter';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import { Loader } from 'react-feather';

const SessionsPage = () => {
  const { 
    sessions, 
    sessionsLoading, 
    sessionsError, 
    fetchSessions, 
    revokeSession,
    revokeLoading,
    revokeError
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

  const renderSessionRow = (session: AuthSession) => (
    <SessionRow key={session.id} $isCurrent={session.isCurrentSession}>
      <SessionInfo>
        <DeviceInfo>
          <strong>{session.deviceInfo}</strong>
          {session.isCurrentSession && <CurrentBadge>Текущая</CurrentBadge>}
        </DeviceInfo>
        <SessionMeta>
          <div>IP: {session.ipAddress}</div>
          <div>{session.isMobile ? 'Мобильное' : 'Десктопное'} устройство</div>
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
          >
            Завершить
          </DarkCyanButton>
        ) : (
          <DarkCyanButton
            onClick={() => handleRevoke()}
            disabled={revokeLoading}
          >
            Выйти на всех устройствах
          </DarkCyanButton>
        )}
      </SessionActions>
    </SessionRow>
  );

  return (
    <Container>
      <Header>
        <Title>Активные сессии</Title>
        <RefreshButton onClick={loadSessions} disabled={sessionsLoading}>
          Обновить
        </RefreshButton>
      </Header>

      {sessionsLoading && <Loader />}
      
      {/* {(sessionsError || localError || revokeError) && (
        <ErrorMessage message={sessionsError || localError || revokeError} />
      )} */}

      {!sessionsLoading && sessions && (
        <SessionsList>
          {sessions.length > 0 ? (
            sessions.map(renderSessionRow)
          ) : (
            <EmptyMessage>Нет активных сессий</EmptyMessage>
          )}
        </SessionsList>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333;
  margin: 0;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SessionRow = styled.div<{ $isCurrent?: boolean }>`
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  ${({ $isCurrent }) => $isCurrent && `
    border-left: 4px solid rgba(0, 125, 136, 1);
  `}
`;

const SessionInfo = styled.div`
  flex: 1;
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const CurrentBadge = styled.span`
  background-color: rgba(0, 125, 136, 0.1);
  color: rgba(0, 125, 136, 1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const SessionMeta = styled.div`
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
`;

const SessionDates = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #888;
`;

const SessionActions = styled.div`
  margin-left: 20px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 16px;
`;

export default SessionsPage;