import styled from "styled-components";
import BaseModal from "./BASE/modalCRUBase";

interface InstallAppHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BrowserName = "chrome" | "edge" | "yandex" | "opera" | "safari" | "other";

const detectBrowser = (): BrowserName => {
  const userAgent = navigator.userAgent;

  if (/YaBrowser/i.test(userAgent)) return "yandex";
  if (/Edg\//i.test(userAgent)) return "edge";
  if (/OPR\//i.test(userAgent)) return "opera";
  if (/Chrome\//i.test(userAgent) || /CriOS\//i.test(userAgent)) return "chrome";
  if (/Safari\//i.test(userAgent)) return "safari";
  return "other";
};

const browserContent: Record<
  BrowserName,
  { title: string; steps: string[] }
> = {
  chrome: {
    title: "Google Chrome",
    steps: [
      "Откройте меню ⋮ в правом верхнем углу.",
      "Выберите «Трансляция, сохранение и отправка».",
      "Нажмите «Установить страницу как приложение» или «Создать ярлык».",
    ],
  },
  edge: {
    title: "Microsoft Edge",
    steps: [
      "Откройте меню ⋯ в правом верхнем углу.",
      "Выберите «Приложения».",
      "Нажмите «Установить этот сайт как приложение».",
    ],
  },
  yandex: {
    title: "Яндекс Браузер",
    steps: [
      "Нажмите значок установки справа в Умной строке.",
      "Выберите «Установить как приложение».",
      "Если пункта нет, откройте боковую панель и выберите «Добавить сайт как приложение».",
    ],
  },
  opera: {
    title: "Opera",
    steps: [
      "Откройте меню браузера.",
      "Найдите пункт «Установить приложение» или «Создать ярлык».",
      "Подтвердите добавление WayPay на компьютер.",
    ],
  },
  safari: {
    title: "Safari",
    steps: [
      "Требуется macOS Sonoma 14 или новее.",
      "В верхнем меню Safari выберите «Файл».",
      "Нажмите «Добавить в Dock» и подтвердите добавление.",
    ],
  },
  other: {
    title: "Ваш браузер",
    steps: [
      "Откройте главное меню браузера.",
      "Найдите пункт «Установить приложение», «Добавить приложение» или «Создать ярлык».",
      "Подтвердите добавление WayPay на компьютер.",
    ],
  },
};

const InstallAppHelpModal = ({ isOpen, onClose }: InstallAppHelpModalProps) => {
  if (!isOpen) return null;

  const browser = browserContent[detectBrowser()];
  const isSecure = window.isSecureContext;

  return (
    <BaseModal
      isOpen={isOpen}
      title="Установка WayPay"
      subtitle={`Инструкция для ${browser.title}`}
      appearance="compact-form"
      width="520px"
      onClose={onClose}
      onCancel={onClose}
      onSave={(event) => {
        event.preventDefault();
        onClose();
      }}
      hideCanselButton
      saveButtonText="Понятно"
    >
      <Content>
        <Icon aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 17L12 21L16 17M12 4V20M5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H18M6 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Icon>
        {!isSecure && (
          <Warning role="alert">
            Автоматическая установка недоступна, потому что сайт открыт по HTTP.
            После подключения корректного HTTPS установка будет открываться одной кнопкой.
          </Warning>
        )}
        <BrowserTitle>Как установить приложение</BrowserTitle>
        <Steps>
          {browser.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </Steps>
      </Content>
    </BaseModal>
  );
};

export default InstallAppHelpModal;

const Content = styled.div`
  padding: 6px 34px 24px;
  text-align: left;
`;

const Icon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(0, 139, 139, 0.1);
  color: #007d88;
`;

const Warning = styled.div`
  margin: 16px 0;
  padding: 12px 14px;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 14px;
  line-height: 1.5;
`;

const BrowserTitle = styled.h3`
  margin: 18px 0 10px;
  color: #1f2937;
  font-size: 16px;
`;

const Steps = styled.ol`
  margin: 0;
  padding-left: 22px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.55;

  li + li {
    margin-top: 7px;
  }
`;
