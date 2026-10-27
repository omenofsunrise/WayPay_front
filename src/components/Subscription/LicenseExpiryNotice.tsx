import React from 'react';
import styled from 'styled-components';
import useCompany from '../../api/hooks/useCompany';
import type { CommonInfo, SubscriptionStatistic } from '../../api/types/company';
import { useAuth } from '../../сontext/AuthContext';
import SubscriptionBlock from './SubscriptionBlock';
import SubscriptionPendingPage from './SubscriptionPending';
import BaseModal from '../modal/BASE/modalCRUBase';

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

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

const getSubscriptionTypeLabel = (subscription: SubscriptionStatistic): string => {
  if (subscription.isFree) return 'Бесплатная';
  if (!subscription.type) return 'Оплаченная';
  return subscription.type;
};

const getDaysText = (days: number): string => {
  if (days === 1) return '1 день';
  if (days > 1 && days < 5) return `${days} дня`;
  return `${days} дней`;
};

const LicenseExpiryNotice: React.FC = () => {
  const { getCommonInfo, getSubscriptionStatistics } = useCompany();
  const { authInfo } = useAuth();
  const [commonInfo, setCommonInfo] = React.useState<CommonInfo | null>(null);
  const [subscriptionStatistics, setSubscriptionStatistics] = React.useState<SubscriptionStatistic[]>([]);
  const [isStatisticsLoading, setIsStatisticsLoading] = React.useState(false);
  const [statisticsError, setStatisticsError] = React.useState<string | null>(null);
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

      setIsStatisticsLoading(true);
      setStatisticsError(null);
      const statistics = await getSubscriptionStatistics(data.id);
      if (!isMounted) return;

      if (statistics) {
        setSubscriptionStatistics(statistics);
      } else {
        setStatisticsError('Не удалось загрузить подробную информацию по подписке');
      }
      setIsStatisticsLoading(false);
    };

    fetchCommonInfo();

    return () => {
      isMounted = false;
    };
  }, [getCommonInfo, getSubscriptionStatistics]);

  const closeNotice = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !commonInfo || daysRemaining === null) return null;

  const hasPaymentUrl = authInfo?.employee?.paymentUrl && authInfo.employee.paymentUrl.trim() !== '';

  return (
    <BaseModal
      title={`До окончания подписки осталось ${getDaysText(daysRemaining)}`}
      subtitle={`Лицензия компании активна до ${formatLicenceDate(commonInfo.licenceDate)}`}
      appearance="compact-form"
      width="720px"
      maxHeight="calc(100vh - 32px)"
      onClose={closeNotice}
      onCancel={closeNotice}
      hideSaveButton
      hideCanselButton
    >
      <NoticeContent>
        <Description>
          Выберите удобный вариант оплаты, чтобы продлить доступ без перерыва.
        </Description>
        <DetailsSection>
          <SectionTitle>Подробная информация</SectionTitle>
          <DetailsGrid>
            <DetailsItem>
              <DetailsLabel>Компания</DetailsLabel>
              <DetailsValue>#{commonInfo.id}</DetailsValue>
            </DetailsItem>
            <DetailsItem>
              <DetailsLabel>Дата окончания</DetailsLabel>
              <DetailsValue>{formatLicenceDate(commonInfo.licenceDate)}</DetailsValue>
            </DetailsItem>
            <DetailsItem>
              <DetailsLabel>Осталось</DetailsLabel>
              <DetailsValue>{getDaysText(daysRemaining)}</DetailsValue>
            </DetailsItem>
          </DetailsGrid>

          {isStatisticsLoading && <MutedText>Загрузка истории подписки...</MutedText>}
          {statisticsError && <ErrorText>{statisticsError}</ErrorText>}
          {!isStatisticsLoading && !statisticsError && subscriptionStatistics.length === 0 && (
            <MutedText>История подписки пока пустая</MutedText>
          )}
          {!isStatisticsLoading && subscriptionStatistics.length > 0 && (
            <StatisticsTableWrapper>
              <StatisticsTable>
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Стоимость</th>
                    <th>Начало</th>
                    <th>Окончание</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionStatistics.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>{getSubscriptionTypeLabel(subscription)}</td>
                      <td>{subscription.isFree ? 'Бесплатно' : `${formatPrice(subscription.cost)} ₽`}</td>
                      <td>{formatLicenceDate(subscription.startAt)}</td>
                      <td>{formatLicenceDate(subscription.endAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </StatisticsTable>
            </StatisticsTableWrapper>
          )}
        </DetailsSection>

        <PaymentSection>
          <SectionTitle>Варианты оплаты</SectionTitle>
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
      </NoticeContent>
    </BaseModal>
  );
};

const NoticeContent = styled.div`
  padding: 6px 34px 28px;
  text-align: left;
`;

const Description = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.5;
`;

const DetailsSection = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #111827;
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DetailsItem = styled.div`
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const DetailsLabel = styled.div`
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.3;
`;

const DetailsValue = styled.div`
  color: #111827;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 600;
`;

const MutedText = styled.div`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 14px;
  line-height: 1.4;
`;

const StatisticsTableWrapper = styled.div`
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const StatisticsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
    font-size: 13px;
    line-height: 1.35;
    text-align: left;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: #ffffff;
    color: #6b7280;
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: none;
  }
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
