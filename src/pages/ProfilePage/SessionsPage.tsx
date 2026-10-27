import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  AlertTriangle,
  Clock,
  Loader,
  MapPin,
  Monitor,
  RefreshCw,
  Shield,
} from 'react-feather';
import { useEmployee } from '../../api/hooks/useEmployee';
import type { AuthSession } from '../../api/types/auth';
import { formatDate } from '../../utils/dateFormatter';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import PinCodeModal from '../../components/modal/PinCodeModal';
import BaseModal from '../../components/modal/BASE/modalCRUBase';
import EmployeeService from '../../api/services/employeeService';
import AccountSwitcher from './AccountSwitcher';

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
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [revokeOthersBusy, setRevokeOthersBusy] = useState(false);

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
      if (sessionId === undefined) {
        window.location.href = '/auth';
        return;
      }
      await loadSessions();
    } catch {
      setLocalError('Не удалось завершить сессию');
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokeOthersBusy(true);
    setLocalError(null);
    try {
      await EmployeeService.revokeAllSessions();
      await loadSessions();
    } catch {
      setLocalError('Не удалось завершить другие сессии');
    } finally {
      setRevokeOthersBusy(false);
    }
  };

  const renderSessionRow = (session: AuthSession) => {
    const device = getDevicePresentation(session.deviceInfo);

    return (
      <SessionCard key={session.id} $isCurrent={session.isCurrentSession}>
        <SessionHeader>
          <BrowserIcon $browser={device.browser} aria-hidden="true" />
          <DeviceHeading>
            <DeviceName>{device.label}</DeviceName>
            {session.isCurrentSession && <CurrentBadge>Текущая сессия</CurrentBadge>}
          </DeviceHeading>
        </SessionHeader>

        <SessionDetails>
          <DetailRow>
            <MapPin size={16} />
            <span>IP: {session.ipAddress || 'Не определён'}</span>
          </DetailRow>
          <DetailRow>
            <Clock size={16} />
            <span>Создана: {formatDate(session.createdAt)}</span>
          </DetailRow>
          <DetailRow>
            <Clock size={16} />
            <span>Активность: {session.isCurrentSession ? 'сейчас' : formatDate(session.lastUsedAt)}</span>
          </DetailRow>
          <DetailRow>
            <Monitor size={16} />
            <span>Истекает: {formatDate(session.expiresAt)}</span>
          </DetailRow>
        </SessionDetails>

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
        <PageTitle>Аккаунт и безопасность</PageTitle>
        <PageSubtitle>Управляйте аккаунтами, защитой входа и устройствами</PageSubtitle>
      </HeaderContainer>

      <TopGrid>
        <AccountSwitcher />

        <SecurityCard>
          <SecurityHeader>
            <SecurityIcon><Shield size={24} /></SecurityIcon>
            <SecurityTitle>Защита входа</SecurityTitle>
          </SecurityHeader>

          {authInfo && (
            <PinSection>
              <PinSectionMain>
                <PinText>
                  <PinTitle>Вход по ПИН-коду</PinTitle>
                  <PinDescription>Запрашивать при входе и после простоя</PinDescription>
                  <PinStatus $disabled={pinDisabled}>
                    {pinDisabled ? 'Отключён' : 'Включён'}
                  </PinStatus>
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
              </PinControl>
            </PinSection>
          )}

          {authInfo?.hasPin && !pinDisabled && (
            <ChangePinButton type="button" onClick={() => setIsChangePinOpen(true)}>
              Изменить ПИН-код
            </ChangePinButton>
          )}
        </SecurityCard>
      </TopGrid>

      <SessionsPanel>
        <SessionsPanelHeader>
          <div>
            <SessionsTitleRow>
              <SessionsTitle>Активные сессии</SessionsTitle>
              <SessionsCount>{sessions?.length ?? 0}</SessionsCount>
            </SessionsTitleRow>
            <SessionsSubtitle>Устройства, на которых выполнен вход</SessionsSubtitle>
          </div>
          <RefreshButton type="button" onClick={() => void loadSessions()} disabled={sessionsLoading}>
            <RefreshCw size={17} />
            Обновить
          </RefreshButton>
        </SessionsPanelHeader>

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

        {sessions && sessions.filter((session) => !session.isCurrentSession).length > 0 && (
          <RevokeOthersButton
            type="button"
            onClick={() => void handleRevokeOtherSessions()}
            disabled={revokeOthersBusy}
          >
            {revokeOthersBusy ? 'Завершение...' : 'Завершить другие сессии'}
          </RevokeOthersButton>
        )}
      </SessionsPanel>

      {isDisableConfirmOpen && (
        <BaseModal
          title="Отключить ПИН-код?"
          subtitle="ПИН-код больше не будет запрашиваться при входе и после простоя."
          appearance="compact-form"
          width="560px"
          onClose={() => !pinBusy && setIsDisableConfirmOpen(false)}
          onCancel={() => !pinBusy && setIsDisableConfirmOpen(false)}
          onSave={(event) => {
            event.preventDefault();
            void handleDisableConfirm();
          }}
          saveButtonText="Отключить ПИН-код"
          isSubmitting={pinBusy}
          submittingText="Отключение..."
        >
          <DisableContent>
            <WarningBox>
              <AlertTriangle size={20} />
              <span>Не отключайте защиту на общем устройстве.</span>
            </WarningBox>
          </DisableContent>
        </BaseModal>
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

      <PinCodeModal
        isOpen={isChangePinOpen}
        mode="setup"
        title="Изменить ПИН-код"
        description="Введите новый 5-значный ПИН-код."
        onSuccess={() => {
          setIsChangePinOpen(false);
          window.location.reload();
        }}
        onCancel={() => setIsChangePinOpen(false)}
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 10px 0 32px;
  overflow-x: hidden;
  box-sizing: border-box;
  text-align: left;

  @media (max-width: 768px) {
    padding: 8px 0 24px;
  }
`;

const HeaderContainer = styled.div`
  width: 100%;
  min-width: 0;
  margin-bottom: 24px;
  box-sizing: border-box;
  text-align: left;
`;

const PageTitle = styled.h1`
  margin: 0;
  width: 100%;
  color: #0f172a;
  font-size: clamp(24px, 1.8vw, 32px);
  font-weight: 700;
  line-height: 1.16;
  text-align: left;
`;

const PageSubtitle = styled.p`
  margin: 7px 0 0;
  color: #7a8495;
  font-size: 15px;

  @media (max-width: 640px) {
    font-size: 15px;
  }
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(340px, 1fr);
  gap: 20px;
  width: 100%;
  margin-bottom: 22px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const SecurityCard = styled.section`
  min-width: 0;
  padding: 24px;
  border: 1px solid #dfe6ed;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
  box-sizing: border-box;
`;

const SecurityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e3e9ef;
`;

const SecurityIcon = styled.div`
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e5f5f6;
  color: #007d88;
`;

const SecurityTitle = styled.h2`
  margin: 0;
  color: #172033;
  font-size: 22px;
`;

const PinSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  padding: 24px 0;
  border-bottom: 1px solid #e3e9ef;
  box-sizing: border-box;
`;

const PinSectionMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const PinText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  text-align: left;
`;

const PinTitle = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
`;

const PinDescription = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  color: #7a8495;
  font-size: 14px;
  text-align: left;
`;

const PinControl = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
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

const PinStatus = styled.span<{ $disabled: boolean }>`
  display: inline-flex;
  margin-top: 8px;
  padding: 5px 10px;
  border-radius: 8px;
  background: ${({ $disabled }) => $disabled ? '#f1f5f9' : '#e5f5f6'};
  color: ${({ $disabled }) => $disabled ? '#7a8495' : '#007d88'};
  font-size: 12px;
  font-weight: 700;
`;

const ChangePinButton = styled.button`
  margin-top: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #007d88;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover { color: #006871; }
`;

const SessionsPanel = styled.section`
  width: 100%;
  padding: 24px;
  border: 1px solid #dfe6ed;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
  box-sizing: border-box;
`;

const SessionsPanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e3e9ef;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const SessionsTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SessionsTitle = styled.h2`
  margin: 0;
  color: #172033;
  font-size: 22px;
`;

const SessionsCount = styled.span`
  min-width: 24px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e5f5f6;
  color: #007d88;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
`;

const SessionsSubtitle = styled.p`
  margin: 6px 0 0;
  color: #7a8495;
  font-size: 14px;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 108px;
  padding: 9px 16px;
  border: 1px solid #ccd6e0;
  border-radius: 9px;
  background: #fff;
  color: #253247;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { border-color: #007d88; color: #007d88; }
  &:disabled { cursor: wait; opacity: 0.65; }
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const SessionCard = styled.article<{ $isCurrent?: boolean }>`
  display: grid;
  grid-template-columns: minmax(210px, 1.2fr) minmax(420px, 2.5fr) auto;
  align-items: center;
  gap: 22px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 16px 0;
  border-bottom: 1px solid #e3e9ef;
  background: ${({ $isCurrent }) => $isCurrent ? '#fbfefe' : '#fff'};
  box-sizing: border-box;

  &:last-child { border-bottom: 0; }

  @media (max-width: 1120px) {
    grid-template-columns: minmax(210px, 1fr) minmax(300px, 1.5fr) auto;
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
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
  border: 1px solid #ccd6e0;
  border-radius: 9px;
  background: #fff;
  color: #253247;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) { border-color: #007d88; color: #007d88; }
  &:disabled { cursor: wait; opacity: 0.65; }

  @media (max-width: 820px) { justify-self: end; }
`;

const RevokeOthersButton = styled.button`
  margin-top: 4px;
  padding: 14px 0 2px;
  border: 0;
  background: transparent;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) { color: #dc2626; }
  &:disabled { cursor: wait; opacity: 0.6; }
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

const DisableContent = styled.div`
  padding: 6px 34px 24px;
  text-align: left;
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

export default SessionsPage;
