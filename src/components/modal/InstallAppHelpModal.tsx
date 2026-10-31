import { useState } from "react";
import { Check, Copy, Download, MonitorDown, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import styled from "styled-components";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import BaseModal from "./BASE/modalCRUBase";

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

const browserContent: Record<BrowserName, { title: string; steps: string[] }> = {
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
    title: "вашего браузера",
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
    <BaseModal
      isOpen={isOpen}
      title="Установить приложение"
      subtitle="WayPay для компьютера и мобильных устройств"
      appearance="compact-form"
      width="920px"
      maxHeight="92vh"
      onClose={onClose}
      onCancel={onClose}
      hideCanselButton
      hideSaveButton
    >
      <Content>
        <DesktopSection>
          <DesktopInfo>
            <SectionIcon>
              <MonitorDown size={22} aria-hidden="true" />
            </SectionIcon>
            <div>
              <SectionTitle>Приложение для компьютера</SectionTitle>
              <SectionDescription>
                Установите веб-версию WayPay для быстрого запуска с рабочего стола.
              </SectionDescription>
            </div>
          </DesktopInfo>

          {isInstalled ? (
            <InstalledBadge>
              <Check size={16} aria-hidden="true" />
              Установлено
            </InstalledBadge>
          ) : canInstall ? (
            <InstallButton type="button" onClick={handleInstall} disabled={isInstalling}>
              <Download size={17} aria-hidden="true" />
              {isInstalling ? "Установка..." : "Установить на компьютер"}
            </InstallButton>
          ) : null}
        </DesktopSection>

        {!isInstalled && !canInstall && (
          <ManualInstall>
            {!isSecure && (
              <Warning role="alert">
                Автоматическая установка недоступна, потому что сайт открыт по HTTP.
              </Warning>
            )}
            <ManualTitle>Установка через {browser.title}</ManualTitle>
            <Steps>
              {browser.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </Steps>
          </ManualInstall>
        )}

        <MobileHeading>
          <div>
            <SectionTitle>Мобильные приложения</SectionTitle>
            <SectionDescription>
              Отсканируйте QR-код или откройте магазин приложений на телефоне.
            </SectionDescription>
          </div>
          <Smartphone size={22} aria-hidden="true" />
        </MobileHeading>

        <CardsGrid>
          {MOBILE_APPS.map((app) => (
            <AppCard key={app.id}>
              <AppHeader>
                <AppTitle>{app.title}</AppTitle>
                <AppSubtitle>{app.subtitle}</AppSubtitle>
              </AppHeader>

              <QrCode>
                <QRCodeSVG value={app.url} size={112} level="M" marginSize={1} title={app.title} />
              </QrCode>

              <AppActions>
                <StoreButton href={app.url} target="_blank" rel="noopener noreferrer">
                  <Download size={16} aria-hidden="true" />
                  Скачать в {app.store}
                </StoreButton>
                <CopyButton type="button" onClick={() => handleCopy(app)}>
                  {copiedId === app.id ? (
                    <>
                      <Check size={15} aria-hidden="true" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy size={15} aria-hidden="true" />
                      Скопировать ссылку
                    </>
                  )}
                </CopyButton>
              </AppActions>
            </AppCard>
          ))}
        </CardsGrid>
      </Content>
    </BaseModal>
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

const Warning = styled.div`
  margin-bottom: 10px;
  padding: 9px 12px;
  border-radius: 7px;
  background: #fff4df;
  color: #a65a00;
  font-size: 13px;
  line-height: 1.4;
`;

const ManualTitle = styled.h4`
  margin: 0 0 7px;
  font-size: 14px;
  font-weight: 600;
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
  }
`;
