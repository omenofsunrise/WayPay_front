import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import apiClient, { API_BASE_URL } from '../../api/client';
import { authStorage } from '../../api/utils/auth-storage';

const PIN_LENGTH = 5;

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
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setAttempts(0);
      setTimeout(() => cellRefs.current[0]?.focus(), 0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH) {
      setError(`Пин-код должен состоять из ${PIN_LENGTH} цифр`);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'setup') {
        await apiClient.post('/Auth/setup-pin', { pinCode: pin });
        onSuccess();
      } else {

        const refreshToken = authStorage.getRefreshToken();
        const accessToken = authStorage.getAccessToken();
        const pinCode = pin;
        const response = await apiClient.post(`${API_BASE_URL}/Auth/refresh`, {
            accessToken,
            refreshToken,
            pinCode
        });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        authStorage.setTokens(newAccessToken, newRefreshToken);

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

  const updatePin = (next: string) => {
    setPin(next);
    if (error) setError('');
  };

  const handleCellChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const next = pin.slice(0, index) + pin.slice(index + 1);
      updatePin(next);
      return;
    }

    // If user pastes / types multiple chars into one cell, distribute starting at this index.
    const chars = raw.split('');
    const before = pin.slice(0, index);
    const merged = (before + chars.join('')).slice(0, PIN_LENGTH);
    updatePin(merged);

    const nextFocus = Math.min(merged.length, PIN_LENGTH - 1);
    cellRefs.current[nextFocus]?.focus();
  };

  const handleCellKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index]) {
        const next = pin.slice(0, index) + pin.slice(index + 1);
        updatePin(next);
        return;
      }
      if (index > 0) {
        const next = pin.slice(0, index - 1) + pin.slice(index);
        updatePin(next);
        cellRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      cellRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      cellRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleCellPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    updatePin(pasted);
    const nextFocus = Math.min(pasted.length, PIN_LENGTH - 1);
    cellRefs.current[nextFocus]?.focus();
  };

  const isDisabled = mode === 'verify' && attempts >= maxAttempts;

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalContent>
          <Title>
            {mode === 'setup' ? 'Установите пин-код' : 'Введите пин-код'}
          </Title>
          {mode === 'setup' && (
            <Description>
              Для безопасности вашего аккаунта установите 5-значный пин-код. Он потребуется для подтверждения важных операций.
            </Description>
          )}
          
          <PinForm onSubmit={handleSubmit}>
            <PinCells role="group" aria-label="Пин-код">
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <PinCell
                  key={index}
                  ref={(el) => { cellRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  autoComplete="one-time-code"
                  value={pin[index] ?? ''}
                  onChange={handleCellChange(index)}
                  onKeyDown={handleCellKeyDown(index)}
                  onPaste={handleCellPaste}
                  onFocus={(e) => e.target.select()}
                  disabled={isDisabled}
                  $filled={Boolean(pin[index])}
                  aria-label={`Цифра ${index + 1}`}
                />
              ))}
            </PinCells>

            {error && <ErrorText>{error}</ErrorText>}

            <SubmitButton
              type="submit"
              disabled={
                isLoading ||
                pin.length !== PIN_LENGTH ||
                isDisabled
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

const PinCells = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
`;

const PinCell = styled.input<{ $filled: boolean }>`
  width: 48px;
  height: 56px;
  padding: 0;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  border: 2px solid ${({ $filled }) => ($filled ? 'rgba(0, 125, 136, 0.5)' : '#e2e8f0')};
  border-radius: 10px;
  background: ${({ $filled }) => ($filled ? 'rgba(0, 125, 136, 0.05)' : '#f8fafc')};
  color: #1f2937;
  caret-color: rgba(0, 125, 136, 1);
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: rgba(0, 125, 136, 1);
    background: white;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.15);
  }

  &:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 52px;
    font-size: 22px;
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