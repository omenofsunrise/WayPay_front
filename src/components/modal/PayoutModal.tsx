import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../ui/fields/CustomInput';
import BaseModal from './BASE/modalCRUBase';
import { formatMoney } from '../../utils/formatPrice';
import type { PayoutSource } from '../../api/types/investorPayout';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  maxAmount: number;
  balance?: number | null;
  isLoading: boolean;
  currentIncome?: number | null; 
  expectedIncome?: number | null;
  payoutSource: PayoutSource;
  onPayoutSourceChange: (source: PayoutSource) => void;
  investment?: number | null;
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
  investment,
  payoutSource,
  onPayoutSourceChange,
  isCompany
}: PayoutModalProps) => {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [actualMaxAmount, setActualMaxAmount] = useState(0);

  useEffect(() => {
    if (balance != null) {
      const maxAllowed = Math.min(balance, maxAmount);
      setActualMaxAmount(maxAllowed);
    } else {
      setActualMaxAmount(maxAmount);
    }

    setWarning('');
    
    if (investment != null && currentIncome == null && expectedIncome == null) {
      onPayoutSourceChange('investment');
    } else {
      onPayoutSourceChange('income');
    }
  }, [maxAmount, balance, investment, currentIncome, expectedIncome]);

  const formatNumber = (num: string): string => {
    if (!num) return '';
    const cleanNum = num.replace(/[^\d]/g, '');
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const parseFormattedNumber = (formatted: string): string => {
    return formatted.replace(/\s/g, '');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    const cleanValue = parseFormattedNumber(value);
    
    onAmountChange(cleanValue);
    setError('');
    setWarning('');
  };

  const handleSourceChange = (source: PayoutSource) => {
    onPayoutSourceChange(source);
    setError('');
    setWarning('');
  };

  const getMaxAmountForSource = (): number => {
    switch (payoutSource) {
      case 'income':
        if (currentIncome != null) return currentIncome;
        if (expectedIncome != null) return expectedIncome;
        return maxAmount;
      case 'investment':
        return investment || 0;
      default:
        return 0;
    }
  };

  const getSourceName = (): string => {
    switch (payoutSource) {
      case 'income':
        return 'доход';
      case 'investment':
        return 'инвестиция';
      default:
        return '';
    }
  };

  const validateAmount = (numericAmount: number) => {
    setError('');
    setWarning('');

    if (!numericAmount) {
      setError('Введите сумму выплаты');
      return false;
    }
    
    if (numericAmount <= 0) {
      setError('Сумма должна быть больше нуля');
      return false;
    }

    // Проверка баланса (общая для всех источников)
    if (balance != null && numericAmount > balance) {
      setError(`Сумма не может превышать баланс ${formatMoney(balance.toString())}`);
      return false;
    }

    // Валидация в зависимости от выбранного источника
    if (payoutSource === 'income') {
      const maxIncomeAmount = getMaxAmountForSource();
      
      if (expectedIncome != null && currentIncome != null) {
        if (numericAmount > currentIncome) {
          if (numericAmount > expectedIncome) {
            setError(`Сумма превышает ожидаемый доход ${formatMoney(expectedIncome.toString())}`);
            return false;
          } else {
            setWarning(
              `Внимание: Выплата (${formatMoney(numericAmount.toString())}) превышает текущий доход ` +
              `(${formatMoney(currentIncome.toString())}). Выплачивается часть ожидаемого дохода.`
            );
          }
        }
      } else if (currentIncome != null) {
        if (numericAmount > currentIncome) {
          setError(`Сумма превышает текущий доход ${formatMoney(currentIncome.toString())}`);
          return false;
        }
      } else if (numericAmount > maxIncomeAmount) {
        setError(`Сумма превышает доступный доход ${formatMoney(maxIncomeAmount.toString())}`);
        return false;
      }
    } else if (payoutSource === 'investment') {
      const maxInvestmentAmount = investment || 0;
      
      if (numericAmount > maxInvestmentAmount) {
        setError(`Сумма превышает инвестицию ${formatMoney(maxInvestmentAmount.toString())}`);
        return false;
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

  const formattedAmount = amount ? formatNumber(amount) : '';
  const maxSourceAmount = getMaxAmountForSource();

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
    >
      <ModalContent>
        <SourceSelector>
          <SourceLabel>Источник выплаты:</SourceLabel>
          <SourceButtons>
            {(currentIncome != null || expectedIncome != null || maxAmount > 0) && (
              <SourceButton
                $active={payoutSource === 'income'}
                onClick={() => handleSourceChange('income')}
                type="button"
              >
                Из дохода
              </SourceButton>
            )}
            {investment != null && investment > 0 && (
              <SourceButton
                $active={payoutSource === 'investment'}
                onClick={() => handleSourceChange('investment')}
                type="button"
              >
                Из инвестиции
              </SourceButton>
            )}
          </SourceButtons>
        </SourceSelector>

        <IncomeInfo>
            <>
              {investment != null && (
                <IncomeItem>
                  <IncomeLabel>Инвестиция:</IncomeLabel>
                  <IncomeValue>{formatMoney(investment.toString())}</IncomeValue>
                </IncomeItem>
              )}
              {(currentIncome != null || maxAmount != null) && (
                <IncomeItem>
                  <IncomeLabel>Текущий доход:</IncomeLabel>
                  <IncomeValue>
                    {formatMoney((currentIncome ?? maxAmount)?.toString() || '0')}
                  </IncomeValue>
                </IncomeItem>
              )}
              {expectedIncome != null && (
                <IncomeItem>
                  <IncomeLabel>Ожидаемый доход:</IncomeLabel>
                  <IncomeValue>{formatMoney(expectedIncome.toLocaleString())}</IncomeValue>
                </IncomeItem>
              )}
            </>
          
          {balance != null && (
            <IncomeItem>
              <IncomeLabel>Касса:</IncomeLabel>
              <IncomeValue>{formatMoney(balance.toString())}</IncomeValue>
            </IncomeItem>
          )}
        </IncomeInfo>

        <InputContainer>
          <CustomInput
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            placeholder={`Введите сумму выплаты из ${getSourceName()}`}
          />
          <AmountHint>
            Максимально доступно: {formatMoney(maxSourceAmount.toString())}
          </AmountHint>
        </InputContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {warning && <WarningMessage>{warning}</WarningMessage>}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const SourceSelector = styled.div`
  margin-bottom: 20px;
`;

const SourceLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
  text-align: left;
`;

const SourceButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SourceButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.$active ? 'rgba(0, 125, 136, 1)' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#495057'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
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

const AmountHint = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin: 10px 0;
  font-size: 14px;
  padding: 8px 12px;
  background: #f8d7da;
  border-radius: 4px;
`;

const WarningMessage = styled.div`
  color: #856404;
  margin: 10px 0;
  font-size: 14px;
  padding: 8px 12px;
  background: #fff3cd;
  border-radius: 4px;
`;

export default PayoutModal;