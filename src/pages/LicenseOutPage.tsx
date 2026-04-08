import { useEffect, useState } from 'react';
import { 
  Typography,
  Link,
  Alert,
  AlertTitle
} from '@mui/material';
import styled from "styled-components";
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/Subscription/ProfileHeader';
import SubscriptionBlock from '../components/Subscription/SubscriptionBlock';
import SubscriptionPendingPage from '../components/Subscription/SubscriptionPending';
import { useAuth } from '../сontext/AuthContext';

const LicenseContainer = styled.div`
  min-height: calc(100vh - 64px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 32px;
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const LicenseInfoSection = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  height: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    position: static;
  }
`;

const LicenseInfoContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const StyledAlert = styled(Alert)`
  margin-bottom: 24px;
  border-radius: 16px;
`;

const ContactSection = styled.div`
  background: #f8f9fa;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  margin-top: auto;
`;

const StyledPhoneLink = styled(Link)`
  font-size: 20px;
  font-weight: 600;
  text-decoration: none;
  color: #007D88;
  
  &:hover {
    text-decoration: underline;
  }
`;

const PaymentProcessContainer = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  overflow: hidden;
`;

const LicenseOutPage = () => {
  const { 
    authInfo,
    refresh
  } = useAuth();
  
  const navigate = useNavigate();

  // Проверяем активна ли лицензия и перенаправляем
  useEffect(() => {
    if (authInfo?.employee?.licenceActive === true) {
      navigate('/credits', { replace: true });
    }
  }, [authInfo, navigate]);

  // Функция для перезагрузки страницы после успешной оплаты
  const handlePaymentComplete = () => {
    // Обновляем данные пользователя
    window.location.reload();
  };

  // Если лицензия активна, не рендерим страницу (перенаправление уже произошло)
  if (authInfo?.employee?.licenceActive === true) {
    return null;
  }

  const showPaymentProcess = authInfo?.employee.paymentUrl;

  return (
    <LicenseContainer>
      <ContentWrapper>
        <ProfileHeader name={authInfo?.employee.fullName} phone={authInfo?.employee.phone} />

        {showPaymentProcess ? (
          // Отображаем процесс оплаты
          <TwoColumnLayout>
            <LicenseInfoSection>
              <LicenseInfoContent>
                <StyledAlert severity="info" variant="outlined">
                  <AlertTitle>Ожидание оплаты</AlertTitle>
                  Для активации лицензии необходимо завершить оплату. 
                  После успешной оплаты доступ будет восстановлен автоматически.
                </StyledAlert>

                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  Вы уже выбрали тариф и начали процесс оплаты. Пожалуйста, завершите платеж 
                  по ссылке ниже. После успешной оплаты доступ будет восстановлен.
                </Typography>

                <ContactSection>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    💳 Есть вопросы по оплате?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Свяжитесь с нами по телефону:
                  </Typography>
                  <StyledPhoneLink href="tel:89899242424">
                    8 (989) 924-24-24
                  </StyledPhoneLink>
                </ContactSection>
              </LicenseInfoContent>
            </LicenseInfoSection>

            <PaymentProcessContainer>
              <SubscriptionPendingPage 
                paymentUrl={authInfo?.employee.paymentUrl}
                onPaymentComplete={handlePaymentComplete}
                expiresAt={authInfo?.employee?.licenceExpire?.toString() || undefined}
                status={authInfo?.employee?.transactionStatus}
                onCheckStatus={async () => {
                  await refresh();
                  return {
                    success: true,
                    status: authInfo.employee.status,
                    transaction_status: authInfo.employee.transactionStatus
                  };
                }}
              />
            </PaymentProcessContainer>
          </TwoColumnLayout>
        ) : (
          <TwoColumnLayout>
            <LicenseInfoSection>
              <LicenseInfoContent>
                <StyledAlert severity="error" variant="outlined">
                  <AlertTitle>Доступ приостановлен</AlertTitle>
                  Срок действия лицензии вашей компании истек. Для восстановления доступа 
                  необходимо продлить лицензию.
                </StyledAlert>

                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  После успешной оплаты доступ будет восстановлен автоматически.
                </Typography>

                <ContactSection>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    📞 Остались вопросы?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Свяжитесь с нами по телефону:
                  </Typography>
                  <StyledPhoneLink href="tel:89899242424">
                    8 (989) 924-24-24
                  </StyledPhoneLink>
                </ContactSection>
              </LicenseInfoContent>
            </LicenseInfoSection>

            <SubscriptionBlock />
          </TwoColumnLayout>
        )}
      </ContentWrapper>
    </LicenseContainer>
  );
};

export default LicenseOutPage;