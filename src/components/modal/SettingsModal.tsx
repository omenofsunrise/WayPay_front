import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import Checkbox from '../ui/CheckBoxes/Checkbox';

interface SettingsModalProps {
  onClose: () => void;
}

// Ключ для хранения настройки в localStorage
const HIDE_CURRENCY_KEY = 'hideCurrencySymbol';

// Функция для получения текущего значения настройки
export const getHideCurrencySetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(HIDE_CURRENCY_KEY);
  if (stored === null) return false; // значение по умолчанию
  
  return stored === 'true';
};

// Функция для сохранения настройки
export const setHideCurrencySetting = (value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HIDE_CURRENCY_KEY, value.toString());
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [hideCurrency, setHideCurrency] = useState(false);

  // Загружаем настройку при монтировании компонента
  useEffect(() => {
    setHideCurrency(getHideCurrencySetting());
  }, []);

  const handleSave = () => {
    console.log('Настройка "Убрать знак ₽":', hideCurrency);
    setHideCurrencySetting(hideCurrency);
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CustomTitle>Настройки</CustomTitle>
        </ModalHeader>
        
        <ModalBody>
          <SettingsSection>
            <Checkbox
                label='Скрывать знак рубля (₽) в интерфейсе'
                checked={hideCurrency}
                onChange={(e) => setHideCurrency(e)}
            />
          </SettingsSection>
        </ModalBody>
        
        <ModalFooter>
          <GrayButton style={{width: "120px"}} onClick={onClose}>Отмена</GrayButton>
          <DarkCyanButton style={{width: "120px"}} onClick={handleSave}>Сохранить</DarkCyanButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

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

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
`;

const SettingsSection = styled.div`
`;

export default SettingsModal;