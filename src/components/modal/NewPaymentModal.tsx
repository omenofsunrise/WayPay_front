import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import CustomInput from '../ui/fields/CustomInput';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import Checkbox from '../ui/CheckBoxes/Checkbox';
import CustomCalendar from '../ui/fields/CustomCalendar';
import BankCardSelect from '../ui/fields/BankCardSelect';
import { useAuth } from '../../сontext/AuthContext';
import { formatPhoneHref } from '../../utils/phoneUtils';

export interface NewPaymentModalProps {
  creditId: number;
  investorName: string;
  clientName: string;
  clientPhone: string;
  currentDebt: number;
  currentMonthDebt: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: 'cash' | 'card';
    bankCardId?: number;
  }) => Promise<number | void>;
  onPrintReceipt?: (paymentId: number) => void;
  clientId?: number;
}

export const PRINT_RECEIPT_STORAGE_KEY = 'new-payment-print-receipt-preference';

// Вспомогательная функция для блокировки скролла
const useLockBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      const body = document.body;
      
      // Блокируем скролл
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      
      return () => {
        // Восстанавливаем скролл
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.overflow = '';
        
        // Восстанавливаем позицию скролла
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  creditId,
  clientName,
  investorName,
  clientPhone,
  currentDebt,
  currentMonthDebt,
  isOpen,
  onClose,
  onSubmit,
  onPrintReceipt,
  clientId
}) => {
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [principalAmount, setPrincipalAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>();
  const [selectedBankCardId, setSelectedBankCardId] = useState<number>(0);
  const [selectedBankCardDetails, setSelectedBankCardDetails] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [remainingDebt, setRemainingDebt] = useState<number>(currentDebt);
  const [isDebtPaid, setIsDebtPaid] = useState<boolean>(currentDebt <= 0);
  const [printReceipt, setPrintReceipt] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { denyPermission } = useAuth();

  // Блокируем скролл body при открытии модалки
  useLockBodyScroll(isOpen);

  // Обработчик клавиши Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Загрузка предпочтений печати
  useEffect(() => {
    const savedPrintPreference = localStorage.getItem(PRINT_RECEIPT_STORAGE_KEY);
    if (savedPrintPreference) {
      try {
        const preference = JSON.parse(savedPrintPreference);
        setPrintReceipt(preference === true);
      } catch (error) {
        console.error('Ошибка при загрузке настройки печати:', error);
        setPrintReceipt(false);
      }
    }
  }, []);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setPaymentDate('');
      setPrincipalAmount('');
      setPaymentMethod(undefined);
      setSelectedBankCardId(0);
      setSelectedBankCardDetails('');
      setTotalAmount(0);
      setRemainingDebt(currentDebt);
      setIsDebtPaid(currentDebt <= 0);
      setIsSubmitting(false);
    }
  }, [isOpen, currentDebt]);

  // Обновление состояния долга
  useEffect(() => {
    setIsDebtPaid(currentDebt <= 0);
    setRemainingDebt(currentDebt - totalAmount);
  }, [currentDebt, totalAmount]);

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
      return;
    }
    
    const numericValue = parseAmount(inputValue);
    const validatedValue = Math.min(numericValue, currentDebt);
    const formattedValue = formatMoney(validatedValue);
    
    setPrincipalAmount(formattedValue);
    setTotalAmount(validatedValue);
  };

  const handleSubmit = async () => {
    if (!paymentDate || totalAmount <= 0 || !paymentMethod || isDebtPaid) return;
    
    if (paymentMethod === 'card' && !selectedBankCardId) {
      return;
    }
    
    const paymentData = {
      paymentDate,
      principalAmount: totalAmount,
      paymentMethod
    };
    
    setIsSubmitting(true);
    
    try {
      const paymentId = await onSubmit(
        paymentMethod === 'card' && selectedBankCardId
          ? { ...paymentData, bankCardId: selectedBankCardId }
          : paymentData
      );

      if (printReceipt && paymentId && onPrintReceipt) {
        onPrintReceipt(paymentId);
      }

      onClose();
      
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
    
  const handleCashChange = (checked: boolean) => {
    if (checked) {
      setPaymentMethod('cash');
      setSelectedBankCardId(0);
      setSelectedBankCardDetails('');
    } else {
      setPaymentMethod(null);
    }
  };

  const handleCardChange = (checked: boolean) => {
    if (checked) {
      setPaymentMethod('card');
    } else {
      setPaymentMethod(null);
      setSelectedBankCardId(0);
      setSelectedBankCardDetails('');
    }
  };

  const handleBankCardSelect = (bankCard: { 
    id: number; 
    details: string;
  }) => {
    setSelectedBankCardId(bankCard.id);
    setSelectedBankCardDetails(bankCard.details);
  };

  const handlePrintReceiptChange = (checked: boolean) => {
    setPrintReceipt(checked);
    localStorage.setItem(PRINT_RECEIPT_STORAGE_KEY, JSON.stringify(checked));
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContent 
        onClick={(e) => e.stopPropagation()}
      >
        <ModalWrapper>
          <CloseButton onClick={onClose}>&times;</CloseButton>
          
          <TitleField>
            {denyPermission('FORBID_CREATING_PAYMENTS') ? (
              <CustomTitle style={{ marginTop: 0 }}>Новый платёж</CustomTitle>              
            ) : (
              <PermissionWarning>
                У вас недостаточно прав для создания платежей
              </PermissionWarning>
            )}
          </TitleField>
          {isDebtPaid ? (
            <DebtPaidMessage>
              <h3>Договор полностью погашен</h3>
              <p>По данному договору нет задолженности. Новые платежи не принимаются.</p>
            </DebtPaidMessage>
          ) : (
            <>
              {denyPermission('FORBID_CREATING_PAYMENTS') && (
                <>
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
                      <PhoneLink href={formatPhoneHref(clientPhone)} onClick={(e) => e.stopPropagation()}>
                        {clientPhone}
                      </PhoneLink>
                    </InputGroup>
                  </FormRow>
                  
                  <ModalInfoTitle style={{ marginTop: '30px' }}>Сведения о платеже</ModalInfoTitle>
                  
                  <FormRow>
                    <InputGroup>
                      <InputLabel>Дата платежа</InputLabel>
                      <CustomCalendar 
                        value={paymentDate} 
                        onChange={setPaymentDate}
                      />
                    </InputGroup>
                    
                    <InputGroup>
                      <InputLabel>Сумма платежа</InputLabel>
                      <CustomInput 
                        inputType="rubles"
                        placeholder="Сумма"
                        value={principalAmount}
                        onChange={handleAmountChange}
                        max={currentDebt}
                      />
                      {totalAmount > currentDebt && (
                        <ErrorText>Сумма платежа не может превышать остаток долга</ErrorText>
                      )}
                    </InputGroup>
                  </FormRow>
                  
                  <FormRow>
                    <InputGroup>
                      <InputLabel>Текущая задолженность</InputLabel>
                      <CustomInput 
                        value={formatMoney(currentMonthDebt)}
                        readOnly
                      />
                    </InputGroup>
                    
                    <InputGroup>
                      <InputLabel>Остаток всего долга</InputLabel>
                      <CustomInput 
                        value={formatMoney(Math.max(0, remainingDebt))}
                        readOnly
                      />
                    </InputGroup>
                  </FormRow>
                  
                  <FormRow>
                    <InputGroup>
                      <CheckboxWrapper>
                        <Checkbox
                          label='Распечатать чек после создания платежа'
                          checked={printReceipt}
                          onChange={handlePrintReceiptChange}
                        />
                      </CheckboxWrapper>
                    </InputGroup>
                  </FormRow>
                  
                  <FormRow>
                    <InputGroup>
                      <InputLabel>Способ оплаты</InputLabel>
                      <PaymentMethodContainer>
                        <CheckboxWrapper>
                          <Checkbox
                            label='Наличными' 
                            checked={paymentMethod === 'cash'} 
                            onChange={handleCashChange}
                          />
                        </CheckboxWrapper>
                        
                        <CheckboxWrapper>
                          <Checkbox 
                            label='Картой'
                            checked={paymentMethod === 'card'} 
                            onChange={handleCardChange}
                          />
                        </CheckboxWrapper>
                      </PaymentMethodContainer>
                    </InputGroup>
                  </FormRow>

                  {paymentMethod === 'card' && (
                    <FormRow>
                      <InputGroup>
                        <InputLabel>Банковская карта</InputLabel>
                        <BankCardSelect
                          value={selectedBankCardDetails}
                          onChange={(details) => setSelectedBankCardDetails(details)}
                          onBankCardSelect={handleBankCardSelect}
                          placeholder="Выберите карту"
                          clientId={clientId}
                          selectedCardId={selectedBankCardId}
                        />
                        {paymentMethod === 'card' && !selectedBankCardId && (
                          <ErrorText>Пожалуйста, выберите банковскую карту</ErrorText>
                        )}
                      </InputGroup>
                    </FormRow>
                  )}
                </>
              )}

            </>
          )}
          
          <ButtonContainer>
            <GrayButton onClick={onClose} disabled={isSubmitting}>
              {denyPermission('FORBID_CREATING_PAYMENTS') ? 'Отменить' : 'Закрыть'}
            </GrayButton>
            {!isDebtPaid &&  (
              <DarkCyanButton 
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !paymentDate || 
                  totalAmount <= 0 || 
                  !paymentMethod || 
                  totalAmount > currentDebt ||
                  (paymentMethod === 'card' && !selectedBankCardId)
                }
              >
                {isSubmitting ? 'Создание...' : 'Создать платёж'}
              </DarkCyanButton>
            )}
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
  overflow-y: auto; // Разрешаем скролл оверлея
  padding: 20px; // Отступы для маленьких экранов
  overflow: hidden; // Отключаем скролл для оверлея
  
  // Отключаем скролл для самого оверлея на мобильных
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw; // Для адаптивности
  max-height: 90vh;
  overflow-y: auto;
  margin: auto; // Центрирование
  position: relative;
  
  // Для плавного скролла на мобильных
  -webkit-overflow-scrolling: touch;
  
  // Скрываем стандартный скроллбар если нужно
  scrollbar-width: thin;
  scrollbar-color: #007D88 #f0f0f0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #007D88;
    border-radius: 3px;
  }
  
  // Убираем скроллбар на очень маленьких экранах
  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    padding: 16px;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    scrollbar-width: none;
  }
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
  z-index: 1;
  
  &:hover {
    opacity: 0.7;
  }
`;

const TitleField = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const PermissionWarning = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 14px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PhoneLink = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 0px 12px;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  font-size: 14px;
  color: #007D88;
  background: #f9fafb;
  text-decoration: none;
  min-height: 38px;
  &:hover {
    color: #005e69;
  }
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
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PaymentMethodContainer = styled.div`
  display: flex;
  gap: 24px;
  
  @media (max-width: 768px) {
    gap: 12px;
    flex-direction: column;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DebtPaidMessage = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  
  h3 {
    color: #28a745;
    margin-bottom: 10px;
  }
  
  p {
    color: #6c757d;
    margin: 0;
  }
`;

const ErrorText = styled.span`
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
`;

export default NewPaymentModal;