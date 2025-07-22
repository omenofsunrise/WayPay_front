import React from 'react';
import styled from 'styled-components';

interface AnalyticItemProps {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  value: string;
  changeValue?: number;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: auto;
`;

const IconContainer = styled.div<{ $iconColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${({ $iconColor }) => $iconColor || '#000'};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: left;
  max-width: 200px;
`;

const Label = styled.span`
  font-size: 15px;
  color: rgba(80, 85, 92, 1);
  white-space: nowrap;
  font-weight: 500;
  max-width: 200px;
`;

const Value = styled.span`
  font-size: 20px;
  font-weight: 600;
  max-width: 200px;
  color: #000;
`;

const ChangeContainer = styled.div`
  display: flex;
  align-items: center;
  max-width: 200px;
  gap: 4px;
`;

const ChangeIcon = styled.div<{ $isPositive: boolean }>`
  transform: ${({ $isPositive }) => ($isPositive ? 'rotate(0deg)' : 'rotate(180deg)')};
`;

const ChangeText = styled.span<{ $isPositive?: boolean; $neutral?: boolean }>`
  color: ${({ $isPositive, $neutral }) =>
    $neutral ? 'rgba(80, 85, 92, 1)' : $isPositive ? '#007D88' : 'rgba(255, 90, 90, 1)'};
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  white-space: pre-line; // Добавляем это свойство
`;

const AnalyticItem: React.FC<AnalyticItemProps> = ({
  icon,
  iconColor,
  label,
  value,
  changeValue,
}) => {
  const renderChangeContent = () => {
    if (changeValue === undefined || changeValue === null) return null;

    if (changeValue === 0) {
      return (
        <ChangeContainer>
          <ChangeText $neutral>
            Отсутствует активность
          </ChangeText>
        </ChangeContainer>
      );
    }

    const isPositive = changeValue > 0;
    const text = isPositive ? 'больше' : 'меньше';
    const formattedValue = changeValue % 1 === 0 ? 
      Math.abs(changeValue) : 
      Math.abs(changeValue).toFixed(1);

    return (
      <ChangeContainer>
        <ChangeIcon $isPositive={isPositive}>
          <svg
            width="11"
            height="9"
            viewBox="0 0 11 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.591604 8.3167H10.4087C10.5081 8.31638 10.6055 8.28897 10.6905 8.23741C10.7754 8.18584 10.8447 8.11208 10.8909 8.02406C10.9371 7.93604 10.9584 7.8371 10.9525 7.73788C10.9466 7.63866 10.9138 7.54292 10.8575 7.46097L5.949 0.370866C5.74557 0.0768989 5.25581 0.0768989 5.05183 0.370866L0.143291 7.46097C0.0864749 7.54275 0.0531565 7.63854 0.0469559 7.73792C0.0407554 7.83731 0.0619099 7.93649 0.108121 8.0247C0.154332 8.1129 0.223833 8.18676 0.309071 8.23824C0.39431 8.28972 0.492026 8.31685 0.591604 8.3167Z"
              fill={isPositive ? '#007D88' : 'rgba(255, 90, 90, 1)'}
            />
          </svg>
        </ChangeIcon>
        <ChangeText $isPositive={isPositive}>
          на {formattedValue}% {text},<br />чем за прошлый период
        </ChangeText>
      </ChangeContainer>
    );
  };

  return (
    <Container>
      <IconContainer $iconColor={iconColor}>{icon}</IconContainer>
      <Content>
        <Label>{label}</Label>
        <Value>{value}</Value>
        {renderChangeContent()}
      </Content>
    </Container>
  );
};

export default AnalyticItem;