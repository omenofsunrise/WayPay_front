import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomInput from '../ui/fields/CustomInput';
import BaseModal from './BASE/modalCRUBase';
import { formatMoney } from '../../utils/formatPrice';

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
    if (balance != null)
    {
      const maxAllowed = Math.min(balance, maxAmount);
      setActualMaxAmount(maxAllowed);
    }
    else {
      setActualMaxAmount(maxAmount);
    }

    setWarning('');
  }, [maxAmount, balance]);

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
    
    
    if (balance != null && numericAmount > balance) {
      setError(`Сумма не может превышать баланс ${formatMoney(balance.toString())}`);
      return false;
    }

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
    } else {
      if (currentIncome != null)
      {
        if (numericAmount > currentIncome) {
          setError(`Сумма превышает текущий доход ${formatMoney(currentIncome.toString())}`);
          return false;
        }
      }
    }

    if (expectedIncome == null && currentIncome == null)
    {
        if (numericAmount > maxAmount) {
          setError(`Сумма превышает текущий доход ${formatMoney(maxAmount.toString())}`);
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
        <IncomeInfo>
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
            placeholder="Введите сумму выплаты"
          />
        </InputContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
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

export default PayoutModal;