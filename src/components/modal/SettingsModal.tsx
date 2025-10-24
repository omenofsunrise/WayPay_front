import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import Checkbox from '../ui/CheckBoxes/Checkbox';

interface SettingsModalProps {
  onClose: () => void;
}

const HIDE_CURRENCY_KEY = 'hideCurrencySymbol';
const AUTO_COLLAPSE_MENU_KEY = 'autoCollapseMenu';

export const getHideCurrencySetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(HIDE_CURRENCY_KEY);
  if (stored === null) return false;
  
  return stored === 'true';
};

export const setHideCurrencySetting = (value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HIDE_CURRENCY_KEY, value.toString());
  }
};

export const getAutoCollapseMenuSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(AUTO_COLLAPSE_MENU_KEY);
  if (stored === null) return false;
  
  return stored === 'true';
};

export const setAutoCollapseMenuSetting = (value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTO_COLLAPSE_MENU_KEY, value.toString());
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [hideCurrency, setHideCurrency] = useState(false);
  const [autoCollapseMenu, setAutoCollapseMenu] = useState(false);

  useEffect(() => {
    setHideCurrency(getHideCurrencySetting());
    setAutoCollapseMenu(getAutoCollapseMenuSetting());
  }, []);

  const handleSave = () => {
    console.log('Настройка "Убрать знак ₽":', hideCurrency);
    console.log('Настройка "Сворачивать меню после выбора":', autoCollapseMenu);
    setHideCurrencySetting(hideCurrency);
    setAutoCollapseMenuSetting(autoCollapseMenu);
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
                label='Скрыть знак рубля (₽) в интерфейсе'
                checked={hideCurrency}
                onChange={(e) => setHideCurrency(e)}
            />
            <Checkbox
                label='Сворачивать меню после выбора пункта'
                checked={autoCollapseMenu}
                onChange={(e) => setAutoCollapseMenu(e)}
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
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export default SettingsModal;