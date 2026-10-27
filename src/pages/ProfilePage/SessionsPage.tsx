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
import PinCodeModal from '../../components/modal/PinCodeModal';
import EmployeeService from '../../api/services/employeeService';

const SessionsPage = () => {
  const { 
    sessions, 
    sessionsLoading, 
    sessionsError, 
    fetchSessions, 
    revokeSession,
    revokeLoading,
    revokeError,
    revokeAllSessions,
    authInfo
  } = useEmployee();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isPinConfirmOpen, setIsPinConfirmOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);

  const pinDisabled = authInfo?.pinDisabled === true;

  // После смены настройки перезагружаем страницу: так приложение заново
  // прочитает /Auth/info и при включении сразу попросит задать пин.
  const handleDisablePin = async (pin?: string) => {
    await EmployeeService.disablePin(pin);
    window.location.reload();
  };

  const handleDisableClick = async () => {
    if (authInfo?.hasPin) {
      setIsPinConfirmOpen(true);
      return;
    }
    setPinBusy(true);
    try {
      await handleDisablePin();
    } catch {
      setLocalError('Не удалось отключить пин-код');
      setPinBusy(false);
    }
  };

  const handleEnableClick = async () => {
    setPinBusy(true);
    try {
      await EmployeeService.enablePin();
      window.location.reload();
    } catch {
      setLocalError('Не удалось включить пин-код');
      setPinBusy(false);
    }
  };

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

      {authInfo && (
        <PinSection>
          <PinText>
            <strong>Пин-код</strong>
            <span>
              {pinDisabled
                ? 'Отключён: при входе и после простоя пин-код не спрашивается.'
                : 'Включён: пин-код спрашивается при входе и после простоя.'}
            </span>
          </PinText>
          {pinDisabled ? (
            <DarkCyanButton onClick={handleEnableClick} disabled={pinBusy}>
              Включить пин-код
            </DarkCyanButton>
          ) : (
            <GrayButton onClick={handleDisableClick} disabled={pinBusy}>
              Отключить пин-код
            </GrayButton>
          )}
        </PinSection>
      )}

      <PinCodeModal
        isOpen={isPinConfirmOpen}
        mode="confirm"
        title="Отключение пин-кода"
        description="Введите текущий пин-код, чтобы отключить его. Пин-код перестанет спрашиваться во всех ваших сессиях."
        onConfirm={handleDisablePin}
        onSuccess={() => setIsPinConfirmOpen(false)}
        onCancel={() => setIsPinConfirmOpen(false)}
      />

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


const PinSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
`;

const PinText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #50555c;

  strong {
    color: #1a202c;
    font-size: 16px;
  }
`;

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