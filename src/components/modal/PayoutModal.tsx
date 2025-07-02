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
}

const PayoutModal = ({
  isOpen,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  maxAmount,
  balance,
  isLoading
}: PayoutModalProps) => {
  const [error, setError] = useState('');
  const [actualMaxAmount, setActualMaxAmount] = useState(0);

  useEffect(() => {
    setActualMaxAmount(Math.min(maxAmount, balance));
  }, [maxAmount, balance]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    onAmountChange(value ? parseInt(value).toString() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    
    if (!numericAmount) {
      setError('Введите сумму выплаты');
      return;
    }
    
    if (numericAmount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    
    if (numericAmount > actualMaxAmount) {
      setError(`Сумма не может превышать ${actualMaxAmount.toLocaleString()} ₽`);
      return;
    }
    
    setError('');
    onSubmit();
  };

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
        <CustomInput
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Введите сумму"
        />
        <MaxAmount>Можно вывести: {actualMaxAmount.toLocaleString()} ₽</MaxAmount>
        <BalanceInfo>Доход: {maxAmount.toLocaleString()} ₽ | Баланс: {balance.toLocaleString()} ₽</BalanceInfo>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const MaxAmount = styled.div`
  margin-top: 8px;
  font-size: 18px;
  color: #6B7280;
  font-weight: 500;
`;

const BalanceInfo = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #9CA3AF;
`;

const ErrorMessage = styled.div`
  color: #EF4444;
  margin: 10px 0;
  font-size: 14px;
`;

export default PayoutModal;