import React, { useState } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import CustomInput from '../ui/fields/CustomInput';
import DateInput from '../ui/fields/DateInput';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import Checkbox from '../ui/CheckBoxes/Checkbox';

export interface NewPaymentModalProps {
  creditId: number;
  investorName: string;
  clientName: string;
  clientPhone: string;
  currentDebt: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: string;
  }) => void;
}

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  creditId,
  clientName,
  investorName,
  clientPhone,
  currentDebt,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [paymentDate, setPaymentDate] = useState<string | null>(null);
  const [principalAmount, setPrincipalAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>();
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [remainingDebt, setRemainingDebt] = useState<number>(currentDebt);

  const formatMoney = (value: number): string => {
    return value.toLocaleString('ru-RU') + '₽';
  };

  const parseAmount = (formatted: string): number => {
    return parseInt(formatted.replace(/[^\d]/g, '')) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === '₽' || inputValue === '') {
      setPrincipalAmount('');
      setTotalAmount(0);
      setRemainingDebt(currentDebt);
      return;
    }
    
    const numericValue = parseAmount(inputValue);
    const formattedValue = formatMoney(numericValue);
    
    setPrincipalAmount(formattedValue);
    setTotalAmount(numericValue);
    setRemainingDebt(currentDebt - numericValue);
  };

  const handleSubmit = () => {
    if (!paymentDate || totalAmount <= 0 || !paymentMethod) return;
    
    onSubmit({
      paymentDate,
      principalAmount: totalAmount,
      paymentMethod
    });
    
    setPaymentDate(null);
    setPrincipalAmount('');
    setPaymentMethod(null);
    setTotalAmount(0);
    setRemainingDebt(currentDebt);
  };

  const handleCashChange = (checked: boolean) => {
    setPaymentMethod(checked ? 'cash' : null);
  };

  const handleCardChange = (checked: boolean) => {
    setPaymentMethod(checked ? 'card' : null);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalWrapper>
          <CloseButton onClick={onClose}>&times;</CloseButton>
          
          <TitleField>
            <CustomTitle style={{ marginTop: 0 }}>Новый платёж</CustomTitle>
          </TitleField>
          
          <ModalInfoTitle>Сведения о договоре</ModalInfoTitle>
          
          <FormRow>
            <InputGroup>
              <InputLabel>№ договора</InputLabel>
              <CustomInput 
                value={creditId.toString()}
                readOnly
              />
            </InputGroup>
            
            <InputGroup>
              <InputLabel>Инвестор</InputLabel>
              <CustomInput 
                value={investorName}
                readOnly
              />
            </InputGroup>
          </FormRow>
          
          <FormRow>
            <InputGroup>
              <InputLabel>Клиент</InputLabel>
              <CustomInput 
                value={clientName}
                readOnly
              />
            </InputGroup>
            
            <InputGroup>
              <InputLabel>Телефон</InputLabel>
              <CustomInput 
                value={clientPhone}
                readOnly
              />
            </InputGroup>
          </FormRow>
          
          <ModalInfoTitle style={{ marginTop: '30px' }}>Сведения о платеже</ModalInfoTitle>
          
          <FormRow>
            <InputGroup>
              <InputLabel>Дата платежа</InputLabel>
              <DateInput 
                value={paymentDate} 
                onChange={setPaymentDate}
              />
            </InputGroup>
            
            <InputGroup>
              <InputLabel>Основной долг</InputLabel>
              <CustomInput 
                inputType="rubles"
                placeholder="Сумма"
                value={principalAmount}
                onChange={handleAmountChange}
                max={currentDebt}
              />
            </InputGroup>
          </FormRow>
          
          <FormRow>
            <InputGroup>
              <InputLabel>Итого</InputLabel>
              <CustomInput 
                value={formatMoney(totalAmount)}
                readOnly
              />
            </InputGroup>
            
            <InputGroup>
              <InputLabel>Остаток долга</InputLabel>
              <CustomInput 
                value={formatMoney(remainingDebt)}
                readOnly
              />
            </InputGroup>
          </FormRow>
          
          <FormRow>
            <InputGroup>
              <InputLabel>Способ оплаты</InputLabel>
              <PaymentMethodContainer>
                <CheckboxWrapper>
                  <Checkbox 
                    checked={paymentMethod === 'cash'} 
                    onChange={handleCashChange} 
                  />
                  <PaymentMethodLabel>Наличные</PaymentMethodLabel>
                </CheckboxWrapper>
                
                <CheckboxWrapper>
                  <Checkbox 
                    checked={paymentMethod === 'card'} 
                    onChange={handleCardChange} 
                  />
                  <PaymentMethodLabel>Карта</PaymentMethodLabel>
                </CheckboxWrapper>
              </PaymentMethodContainer>
            </InputGroup>
          </FormRow>
          
          <ButtonContainer>
            <GrayButton onClick={onClose}>
              Отменить
            </GrayButton>
            <DarkCyanButton 
              onClick={handleSubmit}
              disabled={!paymentDate || totalAmount <= 0}
            >
              Создать платёж
            </DarkCyanButton>
          </ButtonContainer>
        </ModalWrapper>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalWrapper = styled.div`
  margin: 20px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const TitleField = styled.div`
  margin-bottom: 20px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  text-align: left;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
`;

const PaymentMethodContainer = styled.div`
  display: flex;
  gap: 24px;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaymentMethodLabel = styled.span`
  font-size: 14px;
  color: #333;
  user-select: none;
`;

export default NewPaymentModal;