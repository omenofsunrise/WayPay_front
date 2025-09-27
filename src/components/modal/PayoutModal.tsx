import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../ui/fields/CustomInput';
import BaseModal from './BASE/modalCRUBase';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  maxAmount: number;
  balance: number;
  isLoading: boolean;
  currentIncome: number; // Текущий доход
  expectedIncome: number; // Ожидаемый доход
  isCompany: boolean;
}

const PayoutModal = ({
  isOpen,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  maxAmount,
  balance,
  isLoading,
  currentIncome,
  expectedIncome,
  isCompany
}: PayoutModalProps) => {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [actualMaxAmount, setActualMaxAmount] = useState(0);

  useEffect(() => {
    // Максимальная сумма - минимум из баланса и общего дохода
    const maxAllowed = Math.min(balance, maxAmount);
    setActualMaxAmount(maxAllowed);
    
    // Сбрасываем предупреждения при изменении суммы
    setWarning('');
  }, [maxAmount, balance]);

  // Функция для форматирования числа с пробелами тысяч
  const formatNumber = (num: string): string => {
    if (!num) return '';
    // Удаляем все нецифровые символы кроме минуса
    const cleanNum = num.replace(/[^\d]/g, '');
    // Форматируем с пробелами тысяч
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Функция для преобразования отформатированной строки обратно в число
  const parseFormattedNumber = (formatted: string): string => {
    return formatted.replace(/\s/g, '');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Парсим отформатированное значение обратно в чистое число
    const cleanValue = parseFormattedNumber(value);
    
    // Сохраняем чистое число в состоянии
    onAmountChange(cleanValue);
    setError('');
    setWarning('');
  };

  const validateAmount = (numericAmount: number) => {
    setError('');
    setWarning('');

    // Базовые проверки
    if (!numericAmount) {
      setError('Введите сумму выплаты');
      return false;
    }
    
    if (numericAmount <= 0) {
      setError('Сумма должна быть больше нуля');
      return false;
    }
    
    if (numericAmount > balance) {
      setError(`Сумма не может превышать баланс ${balance.toLocaleString()} ₽`);
      return false;
    }

    // Проверка на превышение текущего дохода
    if (numericAmount > currentIncome) {
      if (numericAmount > expectedIncome) {
        setError(`Сумма превышает ожидаемый доход ${expectedIncome.toLocaleString()} ₽`);
        return false;
      } else {
        setWarning(
          `Внимание: Выплата (${numericAmount.toLocaleString()} ₽) превышает текущий доход ` +
          `(${currentIncome.toLocaleString()} ₽). Выплачивается часть ожидаемого дохода.`
        );
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    
    if (!validateAmount(numericAmount)) {
      return;
    }
    
    onSubmit();
  };

  // Получаем отформатированное значение для отображения в инпуте
  const formattedAmount = amount ? formatNumber(amount) : '';

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Выплата инвестору"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={!amount || isLoading}
      isSubmitting={isLoading}
      saveButtonText="Выплатить"
      customActions={warning ? (
        <WarningActionContainer>
          <WarningMessage>{warning}</WarningMessage>
        </WarningActionContainer>
      ) : undefined}
    >
      <ModalContent>
        <IncomeInfo>
          <IncomeItem>
            <IncomeLabel>Текущий доход:</IncomeLabel>
            <IncomeValue>{currentIncome.toLocaleString()} ₽</IncomeValue>
          </IncomeItem>
          <IncomeItem>
            <IncomeLabel>Ожидаемый доход:</IncomeLabel>
            <IncomeValue>{expectedIncome.toLocaleString()} ₽</IncomeValue>
          </IncomeItem>
          <IncomeItem>
            <IncomeLabel>Баланс:</IncomeLabel>
            <IncomeValue>{balance.toLocaleString()} ₽</IncomeValue>
          </IncomeItem>
        </IncomeInfo>

        <InputContainer>
          <CustomInput
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            placeholder="Введите сумму выплаты"
          />
        </InputContainer>
        
        <AmountInfo>
          <MaxAmount>Можно вывести: {actualMaxAmount.toLocaleString()} ₽</MaxAmount>
          <AmountHint>
            Максимум: минимум из дохода ({maxAmount.toLocaleString()} ₽) и баланса ({balance.toLocaleString()} ₽)
          </AmountHint>
        </AmountInfo>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {!error && amount && (
          <ValidationInfo>
            {Number(amount) <= currentIncome ? (
              <SuccessMessage>✓ Сумма в пределах текущего дохода</SuccessMessage>
            ) : Number(amount) <= expectedIncome ? (
              <WarningMessageSmall>
                ⚠ Выплата превышает текущий доход, вы берёте на себя риски просрочек
              </WarningMessageSmall>
            ) : null}
          </ValidationInfo>
        )}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const IncomeInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const IncomeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const IncomeLabel = styled.span`
  font-size: 14px;
  color: #6c757d;
`;

const IncomeValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
`;

const InputContainer = styled.div`
  margin-bottom: 12px;
`;

const AmountInfo = styled.div`
  margin-top: 8px;
`;

const MaxAmount = styled.div`
  font-size: 16px;
  color: #198754;
  font-weight: 500;
  margin-bottom: 4px;
`;

const AmountHint = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin: 10px 0;
  font-size: 14px;
  padding: 8px 12px;
  background: #f8d7da;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #198754;
  font-size: 14px;
  padding: 8px 12px;
  background: #d1e7dd;
  border-radius: 4px;
`;

const WarningMessage = styled.div`
  color: #856404;
  font-size: 14px;
  padding: 12px;
  background: #fff3cd;
  border-radius: 4px;
  margin: 10px 0;
`;

const WarningMessageSmall = styled.div`
  color: #856404;
  font-size: 16px;
  padding: 8px 12px;
  background: #fff3cd;
  border-radius: 4px;
`;

const ValidationInfo = styled.div`
  margin: 10px 0;
`;

const WarningActionContainer = styled.div`
  width: 100%;
  margin-top: 10px;
`;

export default PayoutModal;