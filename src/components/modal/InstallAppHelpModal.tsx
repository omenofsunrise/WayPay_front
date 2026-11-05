import { useState } from "react";
import { Check, Copy, Download, MonitorDown, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import BaseModal from "./BASE/modalCRUBase";
import { useEffect } from "react";
import styled from "styled-components";

interface InstallAppHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MobileApp {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  store: string;
}

type BrowserName = "chrome" | "edge" | "yandex" | "opera" | "safari" | "other";

const MOBILE_APPS: MobileApp[] = [
  {
    id: "client",
    title: "WayPay — клиент",
    subtitle: "Для клиентов · Android",
    url: "https://www.rustore.ru/catalog/app/com.waypay.waypay_client",
    store: "RuStore",
  },
  {
    id: "employee",
    title: "WayPay Mobile",
    subtitle: "Для сотрудников · Android",
    url: "https://www.rustore.ru/catalog/app/com.example.waypay_mobile",
    store: "RuStore",
  },
  {
    id: "ios",
    title: "WayPay для iOS",
    subtitle: "Для iPhone и iPad",
    url: "https://apps.apple.com/app/id6752306977",
    store: "App Store",
  },
];

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
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const browser = browserContent[detectBrowser()];
  const isSecure = window.isSecureContext;

  const handleInstall = async () => {
    if (!canInstall || isInstalling) return;
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopy = async (app: MobileApp) => {
    try {
      await navigator.clipboard.writeText(app.url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = app.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedId(app.id);
    window.setTimeout(
      () => setCopiedId((currentId) => (currentId === app.id ? null : currentId)),
      1800
    );
  };

  return (
    <Overlay onClick={onClose} role="presentation">
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        onClick={(event) => event.stopPropagation()}
      >
        <CloseButton type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </CloseButton>
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
        <Title id="install-app-title">Установка WayPay</Title>
        {!isSecure && (
          <Warning role="alert">
            Автоматическая установка недоступна, потому что сайт открыт по HTTP.
            После подключения корректного HTTPS установка будет открываться одной кнопкой.
          </Warning>
        )}
        <BrowserTitle>Инструкция для {browser.title}</BrowserTitle>
        <Steps>
          {browser.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </Steps>
        <DoneButton type="button" onClick={onClose}>
          Понятно
        </DoneButton>
      </Modal>
    </Overlay>
  );
};

export default InstallAppHelpModal;

const Content = styled.div`
  padding: 10px 34px 30px;
  color: #172235;
  text-align: left;
`;

const DesktopSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px;
  border: 1px solid #dce5eb;
  border-radius: 10px;
  background: #f8fbfc;
`;

const DesktopInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const SectionIcon = styled.div`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 10px;
  background: #e1f5f6;
  color: #008693;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #172235;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
`;

const SectionDescription = styled.p`
  margin: 3px 0 0;
  color: #7b8799;
  font-size: 13px;
  line-height: 1.45;
`;

const InstallButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 210px;
  height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #008693;
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #007681;
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }
`;

const InstalledBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: 999px;
  background: #e2f7f1;
  color: #087f70;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
`;

const ManualInstall = styled.div`
  margin-top: 12px;
  padding: 14px 18px;
  border: 1px solid #e5eaf0;
  border-radius: 10px;
`;

const ManualTitle = styled.h4`
  margin: 0 0 7px;
  font-size: 14px;
  font-weight: 600;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
`;

const Modal = styled.div`
  position: relative;
  width: min(480px, 100%);
  padding: 28px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
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

const Title = styled.h2`
  margin: 18px 0 8px;
  color: #111827;
  font-size: 24px;
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
  padding-left: 20px;
  color: #596579;
  font-size: 13px;
  line-height: 1.45;

  li + li {
    margin-top: 3px;
  }
`;

const MobileHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 0 12px;
  color: #008693;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const AppCard = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 16px;
  border: 1px solid #dce5eb;
  border-radius: 10px;
  background: #fff;
`;

const AppHeader = styled.div`
  width: 100%;
  min-height: 46px;
  text-align: left;
`;

const AppTitle = styled.h4`
  margin: 0;
  color: #172235;
  font-size: 15px;
  font-weight: 700;
`;

const AppSubtitle = styled.p`
  margin: 3px 0 0;
  color: #7b8799;
  font-size: 12px;
`;

const QrCode = styled.div`
  margin: 12px 0 14px;
  padding: 7px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  background: #fff;
  line-height: 0;
`;

const AppActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  margin-top: auto;
`;

const StoreButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 10px;
  border-radius: 7px;
  background: #008693;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: #007681;
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #cfd9e2;
  border-radius: 7px;
  background: #fff;
  color: #526074;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: #008693;
    color: #008693;
  padding-left: 22px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.55;

  li + li {
    margin-top: 7px;
  }
`;

const DoneButton = styled.button`
  width: 100%;
  min-height: 42px;
  margin-top: 24px;
  border: 0;
  border-radius: 9px;
  background: #008b8b;
  color: #fff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #007d88;
  }
`;
