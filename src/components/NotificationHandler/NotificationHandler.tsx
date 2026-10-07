import React, { useEffect, useState, useCallback, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useWebSocket } from "../../api/hooks/useWebSocket";
import { formatRelativeTime } from "../../utils/dateFormatter";
import useNotification from "../../api/hooks/useNotification";
import { FILE_BASE_URL } from "../../api/client";
import { generateAvatar, getInitials } from "../../utils/avatarUtils";
import {
  getShowContractCreationNotificationSetting,
  getDisableWhatsAppNotificationsSetting,
} from "../modal/SettingsModal";

const NotificationsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  gap: 10px;
  flex-direction: column;
  pointer-events: none;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    align-items: center;
  }
`;

const NotificationToast = styled.div<{ isLeaving: boolean; accent?: string }>`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  ${(props) => (props.accent ? `border-left: 4px solid ${props.accent};` : "")}
  min-width: 300px;
  max-width: 500px;
  pointer-events: auto;
  transform: ${(props) =>
    props.isLeaving ? "translateX(100%)" : "translateX(0)"};
  opacity: ${(props) => (props.isLeaving ? 0 : 1)};

  &:hover {
    transform: ${(props) =>
      props.isLeaving ? "translateX(100%)" : "translateY(-2px)"};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.98);
  }

  @media (max-width: 768px) {
    min-width: unset;
    width: 100%;
    max-width: 400px;
  }
`;

const NotificationImage = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  gap: 4px;
  min-width: 0;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const NotificationTitle = styled.span`
  font-weight: 600;
  font-size: 16px;
  color: #212529;
  line-height: 1.2;
`;

const NotificationTime = styled.div`
  color: #6c757d;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 30px;
`;

const NotificationBody = styled.div`
  color: #495057;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  text-align: left;

  a {
    color: rgba(0, 125, 136, 1);
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: rgba(0, 125, 131, 1);
      text-decoration: none;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-bottom: auto;

  &:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const WA_GREEN = "#25D366";

const WhatsAppIconWrap = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: ${WA_GREEN};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
`;

// Фиолетовый акцент — чтобы уведомления-ответы на рекламную рассылку
// визуально не путались с обычными зелёными уведомлениями WhatsApp.
const AD_ACCENT = "#7C3AED";

const AdminWhatsAppIconWrap = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${AD_ACCENT} 0%, ${WA_GREEN} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
`;

const CampaignBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background: rgba(124, 58, 237, 0.12);
  color: ${AD_ACCENT};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 999px;
`;

// Запасная картинка рисуется из инициалов, как в меню колокольчика. Раньше
// здесь стояла ссылка на сторонний домен lets-digit.ru, который не отвечает,
// поэтому место под картинку оставалось пустым.
const fallbackAvatar = (title?: string | null): string =>
  generateAvatar(getInitials(title), 100);

interface Notification {
  id: number;
  title: string;
  body: string;
  image?: string;
  timestamp: Date;
  route?: string;
  isRead: boolean;
  type?: string;
}

// Функция для преобразования текста с ссылками в JSX с кликабельными ссылками
const parseNotificationBody = (text: string): JSX.Element => {
  if (!text) return <></>;

  // Регулярное выражение для поиска URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

const NotificationHandler: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [closingNotifications, setClosingNotifications] = useState<Set<number>>(
    new Set()
  );
  const nextIdRef = React.useRef(1);

  const { getMyNotifications, ReadNotification } = useNotification();

  useEffect(() => {
    const loadInitialNotifications = async () => {
      console.log("📥 Загрузка непрочитанных уведомлений...");
      try {
        const result = await getMyNotifications({
          page: 1,
          pageSize: 10,
          sortDirection: "desc",
        });

        if (result && result.items) {
          const unreadNotifications = result.items
            .filter((item) => !item.isRead)
            .map((item) => ({
              id: item.id,
              title: item.title,
              body: item.message,
              image: item.senderAvatarPath,
              route: item.route,
              timestamp: new Date(item.dateTime),
              isRead: item.isRead,
              type: item.type,
            }));

          console.log(
            `✅ Загружено ${unreadNotifications.length} непрочитанных уведомлений`
          );
          setNotifications(unreadNotifications);
        }
      } catch (error) {
        console.error("❌ Ошибка при загрузке уведомлений:", error);
      }
    };

    loadInitialNotifications();
  }, [getMyNotifications]);

  const handleNewNotification = useCallback((message: any) => {
    console.log(`${message}`);

    const showContractCreation = getShowContractCreationNotificationSetting();
    if (!showContractCreation && message.Type === "credit") {
      return;
    }

    if (
      getDisableWhatsAppNotificationsSetting() &&
      message.Type === "whats_app"
    ) {
      return;
    }

    console.log("🎯 New notification received:", message);

    const newNotification: Notification = {
      id: nextIdRef.current++,
      title: message.Title,
      body: message.Body,
      image: message.Image,
      route: message.Route,
      timestamp: new Date(message.Timestamp || Date.now()),
      isRead: false,
      type: message.Type,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, 5);
      console.log("📋 Notifications updated:", updated);
      return updated;
    });
  }, []);

  const handleWebSocketError = useCallback((error: Event) => {
    console.error("💥 WebSocket error in component:", error);
  }, []);

  useWebSocket({
    onNotification: handleNewNotification,
    onError: handleWebSocketError,
  });

  const removeNotification = (id: number) => {
    setClosingNotifications((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      setClosingNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Notification) => {
    console.log("🖱️ Notification clicked:", notification);

    if (!notification.isRead) {
      try {
        await ReadNotification(notification.id);
        console.log("✅ Уведомление помечено как прочитанное");

        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
      } catch (error) {
        console.error(
          "❌ Ошибка при отметке уведомления как прочитанного:",
          error
        );
      }
    }

    if (notification.route) {
      // Бэкенд присылает относительные пути (напр. "admin/whatsapp/{phone}").
      // Приводим к абсолютному, иначе href резолвится относительно текущего URL.
      const isExternal = /^https?:\/\//.test(notification.route);
      const target =
        isExternal || notification.route.startsWith("/")
          ? notification.route
          : `/${notification.route}`;
      console.log("🔗 Navigating to:", target);

      if (isExternal) {
        window.location.href = target;
      } else {
        // Переход внутри приложения, без перезагрузки. Перезагрузка поднимала
        // непрочитанные заново и показывала только что закрытое уведомление
        // второй раз.
        navigate(target);
      }
    }

    removeNotification(notification.id);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    notification: Notification
  ) => {
    console.warn("❌ Ошибка загрузки изображения, рисуем инициалы");
    e.currentTarget.src = fallbackAvatar(notification.title);
  };

  const handleImageLoad = (notification: Notification) => {
    console.log("✅ Изображение загружено успешно:", notification.image);
  };

  const getNotificationImage = (notification: Notification): string => {
    const path = notification.image?.trim();
    if (!path) return fallbackAvatar(notification.title);
    // Бэкенд отдаёт путь в хранилище, а не готовую ссылку. Без базового
    // адреса браузер ищет файл на своём домене и получает пустоту.
    if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
    const base = FILE_BASE_URL?.endsWith("/")
      ? FILE_BASE_URL
      : `${FILE_BASE_URL ?? ""}/`;
    return `${base}${path.replace(/^\/+/, "")}`;
  };

  const unreadNotifications = notifications.filter((notification) => {
    if (notification.isRead) return false;

    if (
      notification.type === "whats_app" &&
      getDisableWhatsAppNotificationsSetting()
    ) {
      return false;
    }

    const showContractCreation = getShowContractCreationNotificationSetting();
    if (!showContractCreation && notification.type === "credit") {
      return false;
    }

    return true;
  });

  return (
    <NotificationsContainer>
      {unreadNotifications.map((notification) => {
        const isWhatsApp = notification.type === "whats_app";
        const isAdminWhatsApp = notification.type === "admin_whats_app";
        // И обычный, и рекламный WhatsApp в заголовке показывают телефон.
        const displayTitle =
          isWhatsApp || isAdminWhatsApp
            ? formatNotificationPhone(notification.title)
            : notification.title;

        return (
          <NotificationToast
            key={notification.id}
            isLeaving={closingNotifications.has(notification.id)}
            accent={isAdminWhatsApp ? AD_ACCENT : undefined}
            onClick={() => handleNotificationClick(notification)}
          >
            {isAdminWhatsApp ? (
              <AdminWhatsAppIconWrap>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 11v2a1 1 0 0 0 1 1h1l3.5 4.2a1 1 0 0 0 1.77-.64V14h.73l6.35 3.63A1 1 0 0 0 20 16.76V7.24a1 1 0 0 0-1.5-.87L12.15 10H4a1 1 0 0 0-1 1Zm14-3.2v8.4L12.6 12 17 7.8Z" />
                </svg>
              </AdminWhatsAppIconWrap>
            ) : isWhatsApp ? (
              <WhatsAppIconWrap>
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.174.2-.298.299-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .184 5.335.183 11.892c0 2.096.546 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.65 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.477-8.413z" />
                </svg>
              </WhatsAppIconWrap>
            ) : (
              <NotificationImage>
                <img
                  src={getNotificationImage(notification)}
                  alt="Notification"
                  onError={(e) => handleImageError(e, notification)}
                  onLoad={() => handleImageLoad(notification)}
                />
              </NotificationImage>
            )}

            <NotificationContent>
              <NotificationHeader>
                {isAdminWhatsApp && (
                  <CampaignBadge>📣 Ответ на рекламу</CampaignBadge>
                )}
                <NotificationTitle>{displayTitle}</NotificationTitle>
                <NotificationBody>
                  {parseNotificationBody(notification.body)}
                </NotificationBody>
              </NotificationHeader>

              <NotificationTime>
                {formatRelativeTime(notification.timestamp)}
              </NotificationTime>
            </NotificationContent>

            <CloseButton
              onClick={(e) => {
                ReadNotification(notification.id);
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              title="Закрыть"
            >
              ×
            </CloseButton>
          </NotificationToast>
        );
      })}
    </NotificationsContainer>
  );
};

const formatNotificationPhone = (raw: string): string => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(
      7,
      9
    )}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 10) {
    return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(
      6,
      8
    )}-${digits.slice(8, 10)}`;
  }
  if (digits.length >= 11) {
    return `+${digits}`;
  }
  return raw;
};

export default NotificationHandler;
