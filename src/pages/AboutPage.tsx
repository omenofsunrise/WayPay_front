// AboutPage.tsx
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import useCompany from '../api/hooks/useCompany';
import { useAuth } from '../сontext/AuthContext';
import type { CommonInfo } from '../api/types/company';
import { formatPhoneHref } from '../utils/phoneUtils';
import PhoneLink from '../components/ui/links/PhoneLink';
import SubscriptionBlock from '../components/Subscription/SubscriptionBlock';
import SubscriptionPendingPage from '../components/Subscription/SubscriptionPending';

const AboutPage: React.FC = () => {
  const { getCommonInfo } = useCompany();
  const { authInfo } = useAuth();
  const navigate = useNavigate();
  
  const [commonInfo, setCommonInfo] = React.useState<CommonInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommonInfo();
        setCommonInfo(data);
      } catch (err) {
        setError('Не удалось загрузить информацию о компании');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getCommonInfo]);

  // Функция для перезагрузки страницы после успешной оплаты
  const handlePaymentComplete = () => {
    window.location.reload();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getDaysRemaining = (dateString: string): string => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Осталось ${diffDays} дн.`;
    if (diffDays === 0) return 'Истекает сегодня';
    return `Просрочено на ${Math.abs(diffDays)} дн.`;
  };

  // Проверяем наличие paymentUrl
  const hasPaymentUrl = authInfo?.employee?.paymentUrl && authInfo.employee.paymentUrl.trim() !== '';

  if (loading) return <LoadingState>Загрузка...</LoadingState>;
  if (error) return <ErrorState>{error}</ErrorState>;

  return (
    <PageWrapper>
      <MainContent>
        <Header>
          <Title>О приложении</Title>
        </Header>

        <InfoGrid>
          <InfoRow>
            <Label>Версия</Label>
            <Value>beta</Value>
          </InfoRow>
          <InfoRow>
            <Label>Директор</Label>
            <Value>{commonInfo?.directorFullname}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Телефон</Label>
            <PhoneLink href={formatPhoneHref(commonInfo?.phone || '')}>
              {commonInfo?.phone}
            </PhoneLink>
          </InfoRow>
          <InfoRow>
            <Label>Лицензия</Label>
            <Value>
              {commonInfo ? (
                <>
                  {formatDate(commonInfo.licenceDate)}
                  <StatusBadge 
                    $daysRemaining={getDaysRemaining(commonInfo.licenceDate.toString())}
                    $hasPaymentUrl={hasPaymentUrl}
                  >
                    {getDaysRemaining(commonInfo.licenceDate.toString())}
                  </StatusBadge>
                </>
              ) : 'Нет данных'}
            </Value>
          </InfoRow>
        </InfoGrid>

        <PrivacyLink href="/privacy-policy">
          Политика конфиденциальности
        </PrivacyLink>
      </MainContent>

      {hasPaymentUrl ? (
        <PaymentContainer>
          <SubscriptionPendingPage 
            paymentUrl={authInfo.employee.paymentUrl}
            onPaymentComplete={handlePaymentComplete}
            expiresAt={authInfo?.employee?.licenceExpire?.toString() || undefined}
            status={authInfo?.employee?.transactionStatus}
          />
        </PaymentContainer>
      ) : (
        <SubscriptionBlock />
      )}
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const MainContent = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.01em;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #8c8c8c;
  min-width: 100px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.span`
  font-size: 16px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $daysRemaining: string; $hasPaymentUrl: boolean }>`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${props => {
    if (props.$hasPaymentUrl) return '#fff3e0';
    if (props.$daysRemaining.includes('Просрочено')) return '#fee';
    if (props.$daysRemaining.includes('сегодня')) return '#fff3e0';
    return '#e8f5e9';
  }};
  color: ${props => {
    if (props.$hasPaymentUrl) return '#ed6c02';
    if (props.$daysRemaining.includes('Просрочено')) return '#e53935';
    if (props.$daysRemaining.includes('сегодня')) return '#ed6c02';
    return '#2e7d32';
  }};
`;

const PrivacyLink = styled.a`
  display: inline-block;
  font-size: 14px;
  color: #007D88;
  text-decoration: none;
  padding: 8px 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #8c8c8c;
`;

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #e53935;
`;

const PaymentContainer = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  height: fit-content;
`;

export default AboutPage;