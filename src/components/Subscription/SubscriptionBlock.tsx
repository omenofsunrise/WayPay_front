import React, { useState, useEffect } from "react";
import styled from "styled-components";
import useSubscription from "../../api/hooks/useSubscription";
import subscriptionService from "../../api/services/subscriptionService";
import type { PayOption } from "../../api/services/subscriptionService";

interface SubscriptionBlockProps {
  onPaymentSuccess?: () => void;
  compact?: boolean;
}

// Резервный прайс-лист на случай, если эндпоинт /Pay/options недоступен
const FALLBACK_OPTIONS: PayOption[] = [
  { days: 30, cost: 4999 },
  { days: 90, cost: 14999 },
  { days: 180, cost: 29999 },
  { days: 365, cost: 59999 },
];

// Русская плюрализация: [1, 2-4, 5+]
const pluralize = (n: number, forms: [string, string, string]): string => {
  const n100 = n % 100;
  const n10 = n % 10;
  if (n100 >= 11 && n100 <= 14) return forms[2];
  if (n10 === 1) return forms[0];
  if (n10 >= 2 && n10 <= 4) return forms[1];
  return forms[2];
};

// Человекочитаемая подпись по количеству дней (30 → «1 месяц», 365 → «1 год» и т.д.)
const getPlanLabel = (days: number): string => {
  if (days >= 365 && days % 365 === 0) {
    const years = days / 365;
    return `${years} ${pluralize(years, ["год", "года", "лет"])}`;
  }
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return `${months} ${pluralize(months, ["месяц", "месяца", "месяцев"])}`;
  }
  return `${days} ${pluralize(days, ["день", "дня", "дней"])}`;
};

const SubscriptionBlock: React.FC<SubscriptionBlockProps> = ({
  onPaymentSuccess,
  compact = false,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(365);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [options, setOptions] = useState<PayOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const { isLoading, error, subscribe, resetState } = useSubscription();

  // Подтягиваем актуальный прайс-лист (динамическое ценообразование)
  useEffect(() => {
    let active = true;

    subscriptionService
      .getOptions()
      .then((data) => {
        if (!active) return;
        const valid = (data || []).filter((o) => o.days > 0 && o.cost >= 0);
        setOptions(valid.length ? valid : FALLBACK_OPTIONS);
      })
      .catch((err) => {
        console.error("Не удалось загрузить прайс-лист подписки:", err);
        if (active) setOptions(FALLBACK_OPTIONS);
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const subscriptionPlans = [...options]
    .sort((a, b) => a.days - b.days)
    .map((o) => ({ days: o.days, price: o.cost, label: getPlanLabel(o.days) }));

  // Если выбранная длительность отсутствует в полученном прайсе — выбираем самый длинный план
  useEffect(() => {
    if (
      subscriptionPlans.length &&
      !subscriptionPlans.some((p) => p.days === selectedDays)
    ) {
      setSelectedDays(subscriptionPlans[subscriptionPlans.length - 1].days);
    }
  }, [subscriptionPlans, selectedDays]);

  const handleConfirmSubscribe = async () => {
    setShowDisclaimer(false);
    const result = await subscribe(selectedDays);

    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
      onPaymentSuccess?.();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
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

      {optionsLoading ? (
        <LoadingPlans>Загрузка цен...</LoadingPlans>
      ) : (
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
      )}

      <SubscribeButton
        onClick={handleConfirmSubscribe}
        disabled={isLoading || optionsLoading}
      >
        {isLoading ? "Обработка..." : "Оформить"}
      </SubscribeButton>
    </Container>
  );
};

const Container = styled.div<{ $compact?: boolean }>`
  background: white;
  border-radius: ${(props) => (props.$compact ? "8px" : "24px")};
  padding: ${(props) => (props.$compact ? "0" : "32px")};
  box-shadow: ${(props) =>
    props.$compact
      ? "none"
      : "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)"};
  border: ${(props) => (props.$compact ? "none" : "1px solid #f0f0f0")};
  height: fit-content;
  position: ${(props) => (props.$compact ? "static" : "sticky")};
  top: ${(props) => (props.$compact ? "auto" : "20px")};

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

const LoadingPlans = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  margin-bottom: 24px;
  color: #8c8c8c;
  font-size: 14px;
`;

const PlanCard = styled.div<{ $isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$isSelected ? "#f8f9fa" : "white")};
  border: 1px solid ${(props) => (props.$isSelected ? "#007D88" : "#e8e8e8")};
  position: relative;

  &:hover {
    border-color: #007d88;
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
  color: #007d88;
`;

const SelectedIndicator = styled.div`
  position: absolute;
  right: -1px;
  top: -1px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 20px 20px 0;
  border-color: transparent #007d88 transparent transparent;
  border-radius: 0 12px 0 0;
`;

const SubscribeButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #007d88;
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
  background: #007d88;
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
