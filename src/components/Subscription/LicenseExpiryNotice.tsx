import React from 'react';
import styled from 'styled-components';
import useCompany from '../../api/hooks/useCompany';
import type { CommonInfo } from '../../api/types/company';
import { useAuth } from '../../сontext/AuthContext';
import SubscriptionBlock from './SubscriptionBlock';
import SubscriptionPendingPage from './SubscriptionPending';

const NOTICE_DAYS = [7, 3];
const STORAGE_PREFIX = 'licenseExpiryNoticeDismissed';

const getStartOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getDaysRemaining = (date: Date | string): number | null => {
  const targetDate = getStartOfDay(new Date(date));
  if (Number.isNaN(targetDate.getTime())) return null;

  const today = getStartOfDay(new Date());
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getStorageKey = (companyId: number, licenceDate: Date | string, daysRemaining: number): string => {
  const datePart = getStartOfDay(new Date(licenceDate)).toISOString().slice(0, 10);
  return `${STORAGE_PREFIX}:${companyId}:${datePart}:${daysRemaining}`;
};

const formatLicenceDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('ru-RU');
};

const getDaysText = (days: number): string => {
  if (days === 1) return '1 день';
  if (days > 1 && days < 5) return `${days} дня`;
  return `${days} дней`;
};

const LicenseExpiryNotice: React.FC = () => {
  const { getCommonInfo } = useCompany();
  const { authInfo } = useAuth();
  const [commonInfo, setCommonInfo] = React.useState<CommonInfo | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [storageKey, setStorageKey] = React.useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchCommonInfo = async () => {
      const data = await getCommonInfo();
      if (!isMounted || !data?.licenceDate) return;

      const remaining = getDaysRemaining(data.licenceDate);
      if (remaining === null || !NOTICE_DAYS.includes(remaining)) return;

      const nextStorageKey = getStorageKey(data.id, data.licenceDate, remaining);
      if (localStorage.getItem(nextStorageKey) === 'true') return;

      setCommonInfo(data);
      setDaysRemaining(remaining);
      setStorageKey(nextStorageKey);
      setIsVisible(true);
    };

    fetchCommonInfo();

    return () => {
      isMounted = false;
    };
  }, [getCommonInfo]);

  const closeNotice = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !commonInfo || daysRemaining === null) return null;

  const hasPaymentUrl = authInfo?.employee?.paymentUrl && authInfo.employee.paymentUrl.trim() !== '';

  return (
    <Overlay>
      <Modal>
        <CloseButton onClick={closeNotice} aria-label="Закрыть уведомление">
          &times;
        </CloseButton>

        <Header>
          <Eyebrow>Лицензия скоро закончится</Eyebrow>
          <Title>До окончания подписки осталось {getDaysText(daysRemaining)}</Title>
          <Description>
            Лицензия компании активна до {formatLicenceDate(commonInfo.licenceDate)}.
            Выберите удобный вариант оплаты, чтобы продлить доступ без перерыва.
          </Description>
        </Header>

        <PaymentSection>
          {hasPaymentUrl ? (
            <SubscriptionPendingPage
              paymentUrl={authInfo.employee.paymentUrl}
              onPaymentComplete={() => window.location.reload()}
              expiresAt={authInfo.employee.licenceExpire?.toString()}
              status={authInfo.employee.transactionStatus}
            />
          ) : (
            <SubscriptionBlock compact />
          )}
        </PaymentSection>

        <SecondaryButton onClick={closeNotice}>Напомнить позже</SecondaryButton>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
`;

const Modal = styled.div`
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: #111827;
  }
`;

const Header = styled.div`
  padding-right: 28px;
  margin-bottom: 20px;
`;

const Eyebrow = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #007d88;
  margin-bottom: 8px;
`;

const Title = styled.h2`
  margin: 0 0 10px 0;
  color: #111827;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
`;

const Description = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.5;
`;

const PaymentSection = styled.div`
  margin-top: 18px;
`;

const SecondaryButton = styled.button`
  width: 100%;
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

export default LicenseExpiryNotice;
