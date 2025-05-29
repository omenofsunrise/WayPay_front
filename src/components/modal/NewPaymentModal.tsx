import { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomButton from '../ui/Buttons/DarkCyanButton';
import CustomInput from '../ui/fields/CustomInput';
import DateInput from '../ui/fields/DateInput';
import { Modal } from 'react-bootstrap';

export interface PaymentData {
  creditId: number;
  paymentDate: string;
  principalAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentData) => void;
  creditData: {
    id: number;
    investor: string;
    clientFullName: string;
    address: string;
    phone: string;
    remainingAmount: number;
  };
}

const paymentMethods = [
  { value: 'cash', label: 'Наличные' },
  { value: 'bank_transfer', label: 'Банковский перевод' },
  { value: 'card', label: 'Карта' },
  { value: 'other', label: 'Другое' },
];

const NewPaymentModal = ({ isOpen, onClose, onSubmit, creditData }: NewPaymentModalProps) => {
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [principalAmount, setPrincipalAmount] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [remainingAmount, setRemainingAmount] = useState<number>(creditData.remainingAmount);

  useEffect(() => {
    if (creditData) {
      setRemainingAmount(creditData.remainingAmount);
    }
  }, [creditData]);

  const handlePrincipalAmountChange = (value: string) => {
    setPrincipalAmount(value);
    const principal = parseFloat(value) || 0;
    setTotalAmount(principal.toFixed(2));
  };

  const handleSubmit = () => {
    const paymentData: PaymentData = {
      creditId: creditData.id,
      paymentDate,
      principalAmount: parseFloat(principalAmount) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      paymentMethod,
    };
    
    onSubmit(paymentData);
    onClose();
  };

  const calculateRemaining = () => {
    const principal = parseFloat(principalAmount) || 0;
    return (remainingAmount - principal).toFixed(2);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавление платежа">
      <FormContainer>
        <FormRow>
          <FormField>
            <Label>№ Договора</Label>
            <ReadOnlyValue>{creditData.id}</ReadOnlyValue>
          </FormField>
          <FormField>
            <Label>Инвестор</Label>
            <ReadOnlyValue>{creditData.investor}</ReadOnlyValue>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Label>Клиент</Label>
            <ReadOnlyValue>{creditData.clientFullName}</ReadOnlyValue>
          </FormField>
          <FormField>
            <Label>Телефон</Label>
            <ReadOnlyValue>{creditData.phone}</ReadOnlyValue>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Label>Адрес</Label>
            <ReadOnlyValue>{creditData.address}</ReadOnlyValue>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Label>Дата платежа</Label>
            <CustomInput
              value={paymentDate}
              placeholder="Выберите дату"
            />
          </FormField>
          <FormField>
            <Label>Способ оплаты</Label>
            <CustomInput
              value={paymentMethod}
              placeholder="Выберите способ"
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Label>Основной долг</Label>
            <CustomInput
              inputType="number"
              value={principalAmount}
              placeholder="Введите сумму"
            />
          </FormField>
          <FormField>
            <Label>Итого</Label>
            <ReadOnlyValue>{totalAmount} ₽</ReadOnlyValue>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <Label>Остаток долга</Label>
            <ReadOnlyValue>{calculateRemaining()} ₽</ReadOnlyValue>
          </FormField>
        </FormRow>

        <ButtonContainer>
          <CustomButton onClick={onClose} style={{ marginRight: '10px', backgroundColor: '#6B7280' }}>
            Отмена
          </CustomButton>
          <CustomButton onClick={handleSubmit} disabled={!paymentDate || !principalAmount}>
            Сохранить
          </CustomButton>
        </ButtonContainer>
      </FormContainer>
    </Modal>
  );
};

const FormContainer = styled.div`
  padding: 20px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
`;

const FormField = styled.div`
  flex: 1;
`;

const Label = styled.div`
  font-size: 14px;
  color: #4B5563;
  margin-bottom: 5px;
`;

const ReadOnlyValue = styled.div`
  padding: 10px;
  background-color: #F3F4F6;
  border-radius: 4px;
  color: #111827;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
`;

export default NewPaymentModal;