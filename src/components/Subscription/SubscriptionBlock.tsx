import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useSubscription from '../../api/hooks/useSubscription';

interface SubscriptionBlockProps {
  onPaymentSuccess?: () => void;
  compact?: boolean;
}

const SubscriptionBlock: React.FC<SubscriptionBlockProps> = ({ onPaymentSuccess, compact = false }) => {
  const [selectedDays, setSelectedDays] = useState<number>(365);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const { isLoading, error, subscribe, resetState } = useSubscription();

  const subscriptionPlans = [
    { days: 30, price: 4999, label: '1 месяц' },
    { days: 90, price: 14999, label: '3 месяца' },
    { days: 180, price: 29999, label: '6 месяцев' },
    { days: 365, price: 59999, label: '1 год' },
  ];

  const handleConfirmSubscribe = async () => {
    setShowDisclaimer(false);
    const result = await subscribe(selectedDays);

    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
      onPaymentSuccess?.();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <Container $compact={compact}>
      <Header>
        <Title>Подписка</Title>
        <Subtitle>WayPay CRM</Subtitle>
      </Header>

      {error && (
        <ErrorBanner>
          <span>{error}</span>
          <CloseButton onClick={resetState}>×</CloseButton>
        </ErrorBanner>
      )}

      <PlansList>
        {subscriptionPlans.map((plan) => (
          <PlanCard
            key={plan.days}
            $isSelected={selectedDays === plan.days}
            onClick={() => setSelectedDays(plan.days)}
          >
            <PlanLabel>{plan.label}</PlanLabel>
            <PlanPrice>{formatPrice(plan.price)} ₽</PlanPrice>
            {selectedDays === plan.days && <SelectedIndicator />}
          </PlanCard>
        ))}
      </PlansList>

      <SubscribeButton onClick={handleConfirmSubscribe} disabled={isLoading}>
        {isLoading ? 'Обработка...' : 'Оформить'}
      </SubscribeButton>
    </Container>
  );
};

const Container = styled.div<{ $compact?: boolean }>`
  background: white;
  border-radius: ${props => props.$compact ? '8px' : '24px'};
  padding: ${props => props.$compact ? '0' : '32px'};
  box-shadow: ${props => props.$compact ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)'};
  border: ${props => props.$compact ? 'none' : '1px solid #f0f0f0'};
  height: fit-content;
  position: ${props => props.$compact ? 'static' : 'sticky'};
  top: ${props => props.$compact ? 'auto' : '20px'};

  @media (max-width: 900px) {
    position: static;
  }
`;

const Header = styled.div`
  margin-bottom: 28px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
`;

const PlansList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

const PlanCard = styled.div<{ $isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$isSelected ? '#f8f9fa' : 'white'};
  border: 1px solid ${props => props.$isSelected ? '#007D88' : '#e8e8e8'};
  position: relative;

  &:hover {
    border-color: #007D88;
    background: #f8f9fa;
  }
`;

const PlanLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
`;

const PlanPrice = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #007D88;
`;

const SelectedIndicator = styled.div`
  position: absolute;
  right: -1px;
  top: -1px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 20px 20px 0;
  border-color: transparent #007D88 transparent transparent;
  border-radius: 0 12px 0 0;
`;

const SubscribeButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #007D88;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #006b74;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fee;
  color: #e53935;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 13px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #e53935;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
`;

const DisclaimerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const DisclaimerContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 500px;
  width: 100%;
`;

const DisclaimerTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
`;

const DisclaimerText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin: 0 0 24px 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 28px;
  cursor: pointer;

  input {
    margin-top: 2px;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 14px;
    color: #333;
    line-height: 1.4;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e0e0e0;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 24px;
  background: #007D88;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #006b74;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default SubscriptionBlock;
