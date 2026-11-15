import { useState } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { FaCopy, FaCheck, FaDownload } from "react-icons/fa";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";

interface AppEntry {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  store: string;
}

// Ссылки на приложения в магазинах.
const APPS: AppEntry[] = [
  {
    id: "client",
    title: "WayPay — клиент",
    subtitle: "Приложение для клиентов · Android",
    url: "https://www.rustore.ru/catalog/app/com.waypay.waypay_client",
    store: "RuStore",
  },
  {
    id: "mobile",
    title: "WayPay Mobile",
    subtitle: "Приложение для сотрудников · Android",
    url: "https://www.rustore.ru/catalog/app/com.example.waypay_mobile",
    store: "RuStore",
  },
  {
    id: "ios",
    title: "WayPay для iOS",
    subtitle: "App Store · iPhone",
    url: "https://apps.apple.com/app/id6752306977",
    store: "App Store",
  },
];

const MobileAppsPage = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (entry: AppEntry) => {
    try {
      await navigator.clipboard.writeText(entry.url);
      setCopiedId(entry.id);
      setTimeout(
        () => setCopiedId((id) => (id === entry.id ? null : id)),
        1800
      );
    } catch {
      // Фолбэк для старых браузеров/незащищённого контекста
      const ta = document.createElement("textarea");
      ta.value = entry.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(entry.id);
      setTimeout(
        () => setCopiedId((id) => (id === entry.id ? null : id)),
        1800
      );
    }
  };

  return (
    <PageLayout>
      <TitleField>
        <CustomTitle>Мобильные приложения</CustomTitle>
      </TitleField>

      <Hint>
        Отсканируйте QR-код камерой телефона или перейдите по ссылке, чтобы
        скачать и установить приложение из RuStore (Android) или App Store (iOS)
      </Hint>

      <CardsGrid>
        {APPS.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <AppTitle>{entry.title}</AppTitle>
              <AppSubtitle>{entry.subtitle}</AppSubtitle>
            </CardHeader>

            <QrWrap>
              <QRCodeSVG
                value={entry.url}
                size={184}
                level="M"
                marginSize={2}
                title={entry.title}
              />
            </QrWrap>

            <LinkRow>
              <LinkText
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {entry.url}
              </LinkText>
            </LinkRow>

            <Actions>
              <PrimaryButton
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDownload size={14} />
                Скачать в {entry.store}
              </PrimaryButton>
              <CopyButton type="button" onClick={() => handleCopy(entry)}>
                {copiedId === entry.id ? (
                  <>
                    <FaCheck size={14} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <FaCopy size={14} />
                    Скопировать ссылку
                  </>
                )}
              </CopyButton>
            </Actions>
          </Card>
        ))}
      </CardsGrid>
    </PageLayout>
  );
};

const Hint = styled.p`
  color: rgba(80, 85, 92, 1);
  font-size: 14px;
  margin: 4px auto 20px;
  max-width: 720px;
  text-align: center;
`;

const CardsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 320px;
  max-width: 100%;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const CardHeader = styled.div`
  text-align: center;
`;

const AppTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const AppSubtitle = styled.div`
  font-size: 13px;
  color: rgba(80, 85, 92, 1);
  margin-top: 2px;
`;

const QrWrap = styled.div`
  padding: 12px;
  background: #ffffff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  line-height: 0;
`;

const LinkRow = styled.div`
  width: 100%;
  text-align: center;
`;

const LinkText = styled.a`
  font-size: 12px;
  color: rgba(0, 125, 136, 1);
  word-break: break-all;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: auto;
`;

const PrimaryButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border-radius: 8px;
  background: rgba(0, 125, 136, 1);
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 100, 110, 1);
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
    color: rgba(0, 125, 136, 1);
  }
`;

export default MobileAppsPage;
