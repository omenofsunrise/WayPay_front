import { useState } from 'react';
import styled from 'styled-components';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: PaymentData) => void;
  creditId?: number;
  investorName?: string;
  clientName?: string;
  address?: string;
  phone?: string;
  debtAmount?: number;
}

export interface PaymentData {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  comment?: string;
}

const NewPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  creditId, 
  investorName, 
  clientName, 
  address, 
  phone,
  debtAmount
}: NewPaymentModalProps) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [comment, setComment] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!amount || !paymentDate) return;
    
    const paymentData: PaymentData = {
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      comment: comment || undefined
    };
    
    onSave(paymentData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setPaymentDate('');
    setPaymentMethod('cash');
    setComment('');
  };

  const remainingDebt = debtAmount !== undefined && amount 
    ? debtAmount - Number(amount) 
    : debtAmount;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h3>Новый платёж</h3>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <SectionTitle>Сведения о договоре</SectionTitle>
          <InfoGrid>
            <InfoRow>
              <span>№ договора:</span>
              <strong>{creditId || 'Не указан'}</strong>
            </InfoRow>
            
            <InfoRow>
              <span>Инвестор:</span>
              <strong>{investorName || 'Не указан'}</strong>
            </InfoRow>
            
            <InfoRow>
              <span>Клиент:</span>
              <strong>{clientName || 'Не указан'}</strong>
            </InfoRow>
            
            <InfoRow>
              <span>Адрес:</span>
              <strong>{address || 'Не указан'}</strong>
            </InfoRow>
            
            <InfoRow>
              <span>Телефон:</span>
              <strong>{phone || 'Не указан'}</strong>
            </InfoRow>
          </InfoGrid>

          <SectionTitle>Платёж</SectionTitle>
          <InputGrid>
            <InputRow>
              <label>Дата платежа:</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </InputRow>
            
            <InputRow>
              <label>Основной долг:</label>
              <strong>{debtAmount !== undefined ? debtAmount.toFixed(2) : 'Не указан'}</strong>
            </InputRow>
            
            <InputRow>
              <label>Сумма платежа:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </InputRow>
            
            <InputRow>
              <label>Итого:</label>
              <strong>{amount ? Number(amount).toFixed(2) : '0.00'}</strong>
            </InputRow>
            
            <InputRow>
              <label>Остаток долга:</label>
              <strong>
                {remainingDebt !== undefined ? remainingDebt.toFixed(2) : 'Не указан'}
              </strong>
            </InputRow>
            
            <InputRow>
              <label>Способ оплаты:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Наличные</option>
                <option value="bank">Банковский перевод</option>
                <option value="card">Карта</option>
                <option value="other">Другое</option>
              </select>
            </InputRow>
          </InputGrid>
        </ModalBody>
        
        <ModalFooter>
          <CancelButton onClick={onClose}>Отмена</CancelButton>
          <SaveButton 
            onClick={handleSave}
            disabled={!amount || !paymentDate}
          >
            Сохранить платёж
          </SaveButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

// Стили для модального окна
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 1000px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 16px 24px;
`;

const SectionTitle = styled.h4`
  margin: 20px 0 16px;
  color: #008b8b;
  font-size: 1.1rem;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
  
  &:first-child {
    margin-top: 0;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  
  span {
    margin-right: 8px;
    color: #666;
    min-width: 100px;
  }
  
  strong {
    font-weight: 500;
    color: #333;
  }
`;

interface InputRowProps {
  fullWidth?: boolean;
}

const InputRow = styled.div<InputRowProps>`
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
  
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #555;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #008b8b;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 60px;
  }
  
  strong {
    display: inline-block;
    padding: 8px 0;
    font-weight: 500;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #f9f9f9;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  font-weight: 500;
  
  &:hover {
    background: #e9e9e9;
  }
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  background: #008b8b;
  color: white;
  border: none;
  font-weight: 500;
  
  &:hover {
    background: #007a7a;
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

export default NewPaymentModal;