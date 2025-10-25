import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import Checkbox from '../ui/CheckBoxes/Checkbox';
import Tabs from '../ui/fields/Tabs';

interface SettingsModalProps {
  onClose: () => void;
}

export const HIDE_CURRENCY_KEY = 'hideCurrencySymbol';
export const AUTO_COLLAPSE_MENU_KEY = 'autoCollapseMenu';
export const DISABLE_NOTIFICATIONS_KEY = 'disableNotifications';
export const SHOW_CONTRACT_CREATION_NOTIFICATION_KEY = 'showContractCreationNotification';

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

export const getDisableNotificationsSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(DISABLE_NOTIFICATIONS_KEY);
  if (stored === null) return false;
  
  return stored === 'true';
};

export const useLocalStorageSetting = (key: string, defaultValue: boolean) => {
  const [value, setValue] = useState<boolean>(() => getDisableNotificationsSetting());

  useEffect(() => {
    const handleStorageChange = () => {
      setValue(getDisableNotificationsSetting());
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail.key === key) {
        setValue(getDisableNotificationsSetting());
      }
    };
    
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [key]);

  return value;
};

export const setDisableNotificationsSetting = (value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISABLE_NOTIFICATIONS_KEY, value.toString());
    window.dispatchEvent(new CustomEvent('localStorageChange', { 
      detail: { key: DISABLE_NOTIFICATIONS_KEY } 
    }));
  }
};

export const getShowContractCreationNotificationSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(SHOW_CONTRACT_CREATION_NOTIFICATION_KEY);
  if (stored === null) return true;
  
  return stored === 'true';
};

export const setShowContractCreationNotificationSetting = (value: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SHOW_CONTRACT_CREATION_NOTIFICATION_KEY, value.toString());
  }
};

type SettingsTab = 'interface' | 'notifications';

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [hideCurrency, setHideCurrency] = useState(false);
  const [autoCollapseMenu, setAutoCollapseMenu] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [showContractCreationNotification, setShowContractCreationNotification] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('interface');

  useEffect(() => {
    setHideCurrency(getHideCurrencySetting());
    setAutoCollapseMenu(getAutoCollapseMenuSetting());
    setDisableNotifications(getDisableNotificationsSetting());
    setShowContractCreationNotification(getShowContractCreationNotificationSetting());
  }, []);

  const handleSave = () => {
    console.log('Настройка "Убрать знак ₽":', hideCurrency);
    console.log('Настройка "Сворачивать меню после выбора":', autoCollapseMenu);
    console.log('Настройка "Выключить уведомления":', disableNotifications);
    console.log('Настройка "Показывать уведомление при создании договора":', showContractCreationNotification);
    
    setHideCurrencySetting(hideCurrency);
    setAutoCollapseMenuSetting(autoCollapseMenu);
    setDisableNotificationsSetting(disableNotifications);
    setShowContractCreationNotificationSetting(showContractCreationNotification);
    onClose();
  };

  const tabs = [
    {
      id: 'interface',
      label: 'Интерфейс',
      content: (
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
      )
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      content: (
        <SettingsSection>
          <Checkbox
            label='Выключить уведомления'
            checked={disableNotifications}
            onChange={(e) => setDisableNotifications(e)}
          />
          <Checkbox
            label='Показывать уведомление при создании договора'
            checked={showContractCreationNotification}
            onChange={(e) => setShowContractCreationNotification(e)}
            disabled={disableNotifications}
          />
        </SettingsSection>
      )
    }
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CustomTitle style={{marginBottom: "0", paddingBottom: "0"}}>Настройки</CustomTitle>
        </ModalHeader>
        
        <ModalBody style={{marginTop: "0", paddingTop: "0"}}>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab as (tabId: string) => void}
          />
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