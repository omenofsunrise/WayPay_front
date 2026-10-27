import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  AlertTriangle,
  Clock,
  Loader,
  Lock,
  MapPin,
  Monitor,
  X,
} from 'react-feather';
import { useEmployee } from '../../api/hooks/useEmployee';
import type { AuthSession } from '../../api/types/auth';
import { formatDate } from '../../utils/dateFormatter';
import PageLayout from '../../components/ui/Layouts/PageLayout';
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
    authInfo,
  } = useEmployee();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [isPinConfirmOpen, setIsPinConfirmOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);

  const pinDisabled = authInfo?.pinDisabled === true;

  const handleDisablePin = async (pin?: string) => {
    await EmployeeService.disablePin(pin);
    window.location.reload();
  };

  const handleDisableConfirm = async () => {
    if (authInfo?.hasPin) {
      setIsDisableConfirmOpen(false);
      setIsPinConfirmOpen(true);
      return;
    }

    setPinBusy(true);
    setLocalError(null);
    try {
      await handleDisablePin();
    } catch {
      setLocalError('Не удалось отключить ПИН-код');
      setPinBusy(false);
      setIsDisableConfirmOpen(false);
    }
  };

  const handlePinToggle = async () => {
    if (!pinDisabled) {
      setIsDisableConfirmOpen(true);
      return;
    }

    setPinBusy(true);
    setLocalError(null);
    try {
      await EmployeeService.enablePin();
      window.location.reload();
    } catch {
      setLocalError('Не удалось включить ПИН-код');
      setPinBusy(false);
    }
  };

  const loadSessions = useCallback(async () => {
    try {
      await fetchSessions();
      setLocalError(null);
    } catch {
      setLocalError('Не удалось загрузить сессии');
    }
  }, [fetchSessions]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!isDisableConfirmOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pinBusy) setIsDisableConfirmOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDisableConfirmOpen, pinBusy]);

  const handleRevoke = async (sessionId?: number) => {
    try {
      await revokeSession(sessionId);
      await loadSessions();
    } catch {
      setLocalError('Не удалось завершить сессию');
    }
  };

  const renderSessionRow = (session: AuthSession) => {
    const device = getDevicePresentation(session.deviceInfo);

    return (
      <SessionCard key={session.id} $isCurrent={session.isCurrentSession}>
        <SessionMain>
          <SessionHeader>
            <BrowserIcon $browser={device.browser} aria-hidden="true" />
            <DeviceHeading>
              <DeviceName>{device.label}</DeviceName>
              {session.isCurrentSession && <CurrentBadge>Текущая сессия</CurrentBadge>}
            </DeviceHeading>
          </SessionHeader>

          <SessionDetails>
            <DetailRow>
              <MapPin size={17} />
              <span>IP: {session.ipAddress || 'Не определён'}</span>
            </DetailRow>
            <DetailRow>
              <Clock size={17} />
              <span>Создана: {formatDate(session.createdAt)}</span>
            </DetailRow>
            <DetailRow>
              <Clock size={17} />
              <span>Последняя активность: {formatDate(session.lastUsedAt)}</span>
            </DetailRow>
            <DetailRow>
              <Monitor size={17} />
              <span>Истекает: {formatDate(session.expiresAt)}</span>
            </DetailRow>
          </SessionDetails>
        </SessionMain>

        <EndSessionButton
          type="button"
          onClick={() => void handleRevoke(session.isCurrentSession ? undefined : session.id)}
          disabled={revokeLoading}
        >
          {session.isCurrentSession ? 'Завершить текущую сессию' : 'Завершить'}
        </EndSessionButton>
      </SessionCard>
    );
  };

  return (
    <SessionsPageLayout>
      <HeaderContainer>
        <TitleWrapper>
          <PageTitle>Активные сессии</PageTitle>
          <PageSubtitle>Управление активными сессиями вашего аккаунта</PageSubtitle>
        </TitleWrapper>
        <RefreshButton type="button" onClick={() => void loadSessions()} disabled={sessionsLoading}>
          Обновить
        </RefreshButton>
      </HeaderContainer>

      {authInfo && (
        <PinSection>
          <PinSectionMain>
            <PinIcon $disabled={pinDisabled}>
              <Lock size={24} />
            </PinIcon>
            <PinText>
              <strong>Вход по ПИН-коду</strong>
              <span>Запрашивать при входе и после простоя</span>
            </PinText>
          </PinSectionMain>

          <PinControl>
            <SwitchButton
              type="button"
              role="switch"
              aria-checked={!pinDisabled}
              aria-label={pinDisabled ? 'Включить ПИН-код' : 'Отключить ПИН-код'}
              $checked={!pinDisabled}
              onClick={() => void handlePinToggle()}
              disabled={pinBusy}
            >
              <SwitchThumb $checked={!pinDisabled} />
            </SwitchButton>
            <PinStatus>{pinDisabled ? 'Отключён' : 'Включён'}</PinStatus>
          </PinControl>
        </PinSection>
      )}

      {sessionsError || localError || revokeError ? (
        <ErrorMessage>{sessionsError || localError || revokeError}</ErrorMessage>
      ) : null}

      {sessionsLoading ? (
        <LoaderWrapper><Loader /></LoaderWrapper>
      ) : sessions ? (
        <SessionsList>
          {sessions.length > 0
            ? sessions.map(renderSessionRow)
            : <EmptyMessage>Нет активных сессий</EmptyMessage>}
        </SessionsList>
      ) : null}

      {isDisableConfirmOpen && (
        <ModalOverlay
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pinBusy) {
              setIsDisableConfirmOpen(false);
            }
          }}
        >
          <DisableModal role="dialog" aria-modal="true" aria-labelledby="disable-pin-title">
            <CloseButton
              type="button"
              aria-label="Закрыть"
              onClick={() => setIsDisableConfirmOpen(false)}
              disabled={pinBusy}
            >
              <X size={25} />
            </CloseButton>

            <ModalIcon><Lock size={24} /></ModalIcon>
            <ModalTitle id="disable-pin-title">Отключить ПИН-код?</ModalTitle>
            <ModalDescription>
              ПИН-код больше не будет запрашиваться при входе<br />и после простоя.
            </ModalDescription>
            <WarningBox>
              <AlertTriangle size={20} />
              <span>Не отключайте защиту на общем устройстве.</span>
            </WarningBox>
            <ModalActions>
              <CancelButton
                type="button"
                onClick={() => setIsDisableConfirmOpen(false)}
                disabled={pinBusy}
              >
                Отмена
              </CancelButton>
              <ConfirmButton type="button" onClick={() => void handleDisableConfirm()} disabled={pinBusy}>
                {pinBusy ? 'Отключение...' : 'Отключить ПИН-код'}
              </ConfirmButton>
            </ModalActions>
          </DisableModal>
        </ModalOverlay>
      )}

      <PinCodeModal
        isOpen={isPinConfirmOpen}
        mode="confirm"
        title="Подтвердите отключение"
        description="Введите текущий ПИН-код, чтобы отключить защиту."
        onConfirm={handleDisablePin}
        onSuccess={() => setIsPinConfirmOpen(false)}
        onCancel={() => setIsPinConfirmOpen(false)}
      />
    </SessionsPageLayout>
  );
};

type BrowserKind = 'chrome' | 'edge' | 'yandex' | 'opera' | 'firefox' | 'safari' | 'other';

const getDevicePresentation = (deviceInfo: string): { label: string; browser: BrowserKind } => {
  if (!deviceInfo) return { label: 'Неизвестное устройство', browser: 'other' };

  const browser: BrowserKind = /YaBrowser/i.test(deviceInfo)
    ? 'yandex'
    : /Edg\//i.test(deviceInfo)
      ? 'edge'
      : /OPR\//i.test(deviceInfo)
        ? 'opera'
        : /Firefox\//i.test(deviceInfo)
          ? 'firefox'
          : /Chrome\//i.test(deviceInfo)
            ? 'chrome'
            : /Safari\//i.test(deviceInfo)
              ? 'safari'
              : 'other';

  const browserNames: Record<BrowserKind, string> = {
    chrome: 'Chrome',
    edge: 'Microsoft Edge',
    yandex: 'Яндекс Браузер',
    opera: 'Opera',
    firefox: 'Firefox',
    safari: 'Safari',
    other: 'Браузер',
  };

  const os = /Windows NT/i.test(deviceInfo)
    ? 'Windows'
    : /Android/i.test(deviceInfo)
      ? 'Android'
      : /iPhone|iPad|iPod/i.test(deviceInfo)
        ? 'iOS'
        : /Macintosh|Mac OS X/i.test(deviceInfo)
          ? 'macOS'
          : /Linux/i.test(deviceInfo)
            ? 'Linux'
            : '';

  if (browser === 'other' && !os && deviceInfo.length <= 70) {
    return { label: deviceInfo.replace(/\s*[|/]\s*/g, ' · '), browser };
  }

  return {
    label: os ? `${browserNames[browser]} · ${os}` : browserNames[browser],
    browser,
  };
};

const SessionsPageLayout = styled(PageLayout)`
  width: auto;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 12px 0 32px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 12px 0 28px;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  width: 100%;
  min-width: 0;
  margin-bottom: 20px;
  box-sizing: border-box;

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const TitleWrapper = styled.div`
  min-width: 0;
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #0f172a;
  font-size: clamp(24px, 1.8vw, 32px);
  font-weight: 700;
  line-height: 1.16;
`;

const PageSubtitle = styled.p`
  margin: 4px 0 0;
  color: #007d88;
  font-size: 15px;

  @media (max-width: 640px) {
    font-size: 15px;
  }
`;

const RefreshButton = styled.button`
  min-width: 108px;
  padding: 9px 18px;
  border: 0;
  border-radius: 10px;
  background: #e2e5e9;
  color: #182033;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #d7dce2; }
  &:disabled { cursor: wait; opacity: 0.65; }
`;

const PinSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  padding: 18px 22px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  box-sizing: border-box;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
`;

const PinSectionMain = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`;

const PinIcon = styled.div<{ $disabled: boolean }>`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ $disabled }) => $disabled ? '#f1f5f9' : '#e3f6f7'};
  color: ${({ $disabled }) => $disabled ? '#94a3b8' : '#007d88'};
`;

const PinText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  strong {
    color: #111827;
    font-size: 18px;
    line-height: 1.2;
  }

  span {
    color: #7a8495;
    font-size: 14px;
  }
`;

const PinControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    align-self: flex-end;
  }
`;

const SwitchButton = styled.button<{ $checked: boolean }>`
  position: relative;
  width: 60px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $checked }) => $checked ? '#008b95' : '#cbd5e1'};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:focus-visible {
    outline: 3px solid rgba(0, 139, 149, 0.25);
    outline-offset: 3px;
  }

  &:disabled { cursor: wait; opacity: 0.65; }
`;

const SwitchThumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 4px;
  left: ${({ $checked }) => $checked ? '30px' : '4px'};
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e4e7eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
  transition: left 0.2s ease;
`;

const PinStatus = styled.span`
  color: #172033;
  font-size: 15px;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const SessionCard = styled.article<{ $isCurrent?: boolean }>`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 188px;
  padding: 20px 22px 18px 24px;
  border: 1px solid #e3e8ef;
  border-left: 4px solid ${({ $isCurrent }) => $isCurrent ? '#008b95' : '#e3e8ef'};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 2px 9px rgba(15, 23, 42, 0.035);
  box-sizing: border-box;

  @media (max-width: 720px) {
    flex-direction: column;
    padding: 18px 16px;
  }
`;

const SessionMain = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
`;

const SessionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
`;

const BrowserIcon = styled.div<{ $browser: BrowserKind }>`
  position: relative;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $browser }) => {
    if ($browser === 'chrome') return 'conic-gradient(#db4437 0 33%, #f4b400 0 56%, #0f9d58 0 78%, #db4437 0)';
    if ($browser === 'firefox') return 'linear-gradient(145deg, #7c3aed, #f97316 58%, #facc15)';
    if ($browser === 'opera') return 'linear-gradient(145deg, #ff1b2d, #a70014)';
    if ($browser === 'safari') return 'linear-gradient(145deg, #60a5fa, #0ea5e9)';
    return 'linear-gradient(145deg, #00a4a6, #2563eb)';
  }};
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);

  &::before {
    content: '';
    position: absolute;
    inset: 11px;
    border: 3px solid #dbeafe;
    border-radius: 50%;
    background: ${({ $browser }) => $browser === 'chrome' ? '#4285f4' : '#f8fafc'};
  }
`;

const DeviceHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin: 0;
`;

const DeviceName = styled.strong`
  color: #111827;
  font-size: 17px;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const CurrentBadge = styled.span`
  padding: 4px 9px;
  border-radius: 5px;
  background: #def2f3;
  color: #007d88;
  font-size: 12px;
  font-weight: 500;
`;

const SessionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #707b8d;
  font-size: 13px;
  overflow-wrap: anywhere;

  svg { flex: 0 0 auto; color: #707b8d; }
`;

const EndSessionButton = styled.button`
  flex: 0 0 auto;
  min-width: 124px;
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  background: #00838d;
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #006f77; }
  &:disabled { cursor: wait; opacity: 0.65; }

  @media (max-width: 720px) { align-self: flex-end; }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px;
  color: #007d88;
`;

const ErrorMessage = styled.div`
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #dc2626;
`;

const EmptyMessage = styled.div`
  padding: 48px;
  border: 1px solid #e3e8ef;
  border-radius: 15px;
  background: #fff;
  color: #7a8495;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(3px);
`;

const DisableModal = styled.div`
  position: relative;
  width: min(560px, 100%);
  padding: 30px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.3);

  @media (max-width: 600px) { padding: 24px 20px; }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  cursor: pointer;

  &:hover:not(:disabled) { background: #f1f5f9; }
`;

const ModalIcon = styled.div`
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: #e3f6f7;
  color: #008b95;
`;

const ModalTitle = styled.h2`
  margin: 0 0 10px;
  color: #111827;
  font-size: 28px;
  line-height: 1.2;

  @media (max-width: 600px) { font-size: 25px; }
`;

const ModalDescription = styled.p`
  margin: 0;
  color: #798396;
  font-size: 16px;
  line-height: 1.55;
`;

const WarningBox = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 22px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff4df;
  color: #a55700;
  font-size: 14px;

  svg { flex: 0 0 auto; color: #d97706; }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 26px;

  @media (max-width: 480px) { flex-direction: column-reverse; }
`;

const CancelButton = styled.button`
  padding: 11px 20px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #172033;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #f8fafc; }
`;

const ConfirmButton = styled.button`
  padding: 11px 20px;
  border: 0;
  border-radius: 10px;
  background: #008b95;
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #00747c; }
  &:disabled { cursor: wait; opacity: 0.65; }
`;

export default SessionsPage;
