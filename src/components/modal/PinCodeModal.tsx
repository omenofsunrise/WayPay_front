import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/client';

interface PinCodeModalProps {
  isOpen: boolean;
  onSuccess: (pin?: string) => void;
  mode: 'setup' | 'verify';
  onMaxAttempts?: () => void;
  tokenId?: string;
  maxAttempts?: number;
  currentAttempts?: number;
}

const PinCodeModal: React.FC<PinCodeModalProps> = ({ 
  isOpen, 
  onSuccess, 
  mode = 'setup', 
  onMaxAttempts,
  tokenId,
  maxAttempts = 3,
  currentAttempts = 0
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(currentAttempts);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setAttempts(0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 5) {
      setError('Пин-код должен состоять из 5 цифр');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'setup') {
        await apiClient.post('/Auth/setup-pin', { pinCode: pin });
        onSuccess();
      } else {
        onSuccess(pin);
      }
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        if (onMaxAttempts) onMaxAttempts();
        setError('Превышено количество попыток. Доступ заблокирован.');
        return;
      }
      
      setError(mode === 'setup' 
        ? 'Ошибка при установке пин-кода' 
        : `Неверный пин-код. Осталось попыток: ${maxAttempts - newAttempts}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 5) {
      setPin(value);
      if (error) setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalContent>
          <Title>
            {mode === 'setup' ? 'Установите пин-код' : 'Введите пин-код'}
          </Title>
          <Description>
            {mode === 'setup' 
              ? 'Для безопасности вашего аккаунта установите 5-значный пин-код. Он потребуется для подтверждения важных операций.'
              : 'Для подтверждения операции введите ваш 5-значный пин-код.'}
          </Description>
          
          <PinForm onSubmit={handleSubmit}>
            <PinInput
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={5}
              value={pin}
              onChange={handlePinChange}
              autoFocus
              disabled={mode === 'verify' && attempts >= 3}
            />
            
            {error && <ErrorText>{error}</ErrorText>}
            
            <SubmitButton 
              type="submit" 
              disabled={
                isLoading || 
                pin.length !== 5 || 
                (mode === 'verify' && attempts >= 3)
              }
            >
              {isLoading 
                ? (mode === 'setup' ? 'Сохранение...' : 'Проверка...') 
                : (mode === 'setup' ? 'Подтвердить' : 'Продолжить')}
            </SubmitButton>
          </PinForm>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 125, 136, 0.2);
  width: 100%;
  max-width: 400px;
  padding: 30px;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 22px;
  margin-bottom: 15px;
  color: #333;
  text-align: center;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 25px;
  line-height: 1.5;
`;

const PinForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PinInput = styled.input`
  width: 150px;
  padding: 15px;
  font-size: 24px;
  text-align: center;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:focus {
    border-color: rgba(0, 125, 136, 0.5);
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.1);
  }
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
`;

const SubmitButton = styled.button`
  background: linear-gradient(90deg, rgba(0, 125, 136, 1) 0%, rgba(37, 203, 161, 1) 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default PinCodeModal;