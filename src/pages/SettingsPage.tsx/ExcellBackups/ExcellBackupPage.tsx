import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import BaseModal from "../../../components/modal/BASE/modalCRUBase";
import useExcellBackupSubscription from "../../../api/hooks/useExcellBackupSubscription";
import type {
  ExcellBackupSubscription,
  ExcellBackupSubscriptionPayload,
  Messenger,
} from "../../../api/types/excellBackup";
import {
  BACKUP_ITEM,
  MESSENGER_OPTIONS,
  hasItem,
  messengerLabel,
} from "../../../api/types/excellBackup";
import { extractErrorMessage } from "../../../api/utils/errorMessage";
import MessengerBackupCard from "./MessengerBackupCard";

const ExcellBackupPage = () => {
  const {
    subscriptions,
    loading,
    error,
    saving,
    fetchAll,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  } = useExcellBackupSubscription();

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);
  const [confirmMessenger, setConfirmMessenger] = useState<Messenger | null>(
    null
  );
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(
        () => setToasts((current) => current.filter((toast) => toast.id !== id)),
        4000
      );
    },
    []
  );

  const loadSubscriptions = useCallback(async () => {
    try {
      await fetchAll();
    } catch {
      // Хук возвращает текст ошибки для отображения на странице.
    }
  }, [fetchAll]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const findCreditsSub = (
    messenger: Messenger
  ): ExcellBackupSubscription | null =>
    subscriptions.find(
      (subscription) =>
        subscription.messenger === messenger &&
        hasItem(subscription.items, BACKUP_ITEM.Credits)
    ) ?? null;

  const connectedCount = MESSENGER_OPTIONS.filter((messenger) =>
    findCreditsSub(messenger.value)
  ).length;

  const handleSave = async (messenger: Messenger, contact: string) => {
    const payload: ExcellBackupSubscriptionPayload = {
      messenger,
      contact,
      items: BACKUP_ITEM.Credits,
    };
    const existing = findCreditsSub(messenger);

    try {
      if (existing) {
        await updateSubscription(existing.id, payload);
        addToast("success", `${messengerLabel(messenger)}: контакт обновлён`);
      } else {
        await createSubscription(payload);
        addToast("success", `${messengerLabel(messenger)}: канал подключён`);
      }
    } catch (requestError) {
      addToast(
        "error",
        extractErrorMessage(requestError, "Не удалось сохранить подписку")
      );
      throw requestError;
    }
  };

  const requestDelete = (messenger: Messenger) => {
    if (findCreditsSub(messenger)) setConfirmMessenger(messenger);
  };

  const handleConfirmDelete = async () => {
    if (!confirmMessenger) return;
    const subscription = findCreditsSub(confirmMessenger);

    if (!subscription) {
      setConfirmMessenger(null);
      return;
    }

    setConfirmSubmitting(true);
    try {
      await deleteSubscription(subscription.id);
      addToast(
        "success",
        `${messengerLabel(confirmMessenger)}: канал отключён`
      );
    } catch (requestError) {
      addToast(
        "error",
        extractErrorMessage(requestError, "Не удалось отключить подписку")
      );
    } finally {
      setConfirmSubmitting(false);
      setConfirmMessenger(null);
    }
  };

  return (
    <BackupPage>
      <PageHeader>
        <PageIcon>
          <ExcelFileIcon />
        </PageIcon>
        <div>
          <PageTitle>Excel-бэкапы</PageTitle>
          <PageSubtitle>
            Получайте резервную копию в Excel автоматически каждую ночь.
          </PageSubtitle>
        </div>
      </PageHeader>

      <InfoBanner>
        <InfoIcon />
        <span>
          Достаточно подключить один канал. Можно использовать несколько
          одновременно.
        </span>
      </InfoBanner>

      <ChannelsHeader>
        <ChannelsTitle>Каналы получения</ChannelsTitle>
        <ConnectedCount>
          Подключено: {connectedCount} из {MESSENGER_OPTIONS.length}
        </ConnectedCount>
      </ChannelsHeader>

      {loading && <StateMessage>Загрузка каналов...</StateMessage>}
      {error && <StateMessage $error>Ошибка: {error}</StateMessage>}

      {!loading && !error && (
        <CardsGrid>
          {MESSENGER_OPTIONS.map((messenger) => (
            <MessengerBackupCard
              key={messenger.value}
              messenger={messenger.value}
              subscription={findCreditsSub(messenger.value)}
              isSaving={saving}
              onSave={(contact) => handleSave(messenger.value, contact)}
              onDelete={() => requestDelete(messenger.value)}
            />
          ))}
        </CardsGrid>
      )}

      <ScheduleNote>
        <MoonIcon />
        Автоматическая отправка каждую ночь.
      </ScheduleNote>

      {confirmMessenger && (
        <BaseModal
          title="Отключить подписку?"
          onClose={() => setConfirmMessenger(null)}
          onCancel={() => setConfirmMessenger(null)}
          onSave={(event) => {
            event.preventDefault();
            handleConfirmDelete();
          }}
          isSubmitting={confirmSubmitting}
          saveButtonText="Отключить"
          width="420px"
        >
          <ConfirmText>
            Выгрузка в {messengerLabel(confirmMessenger)} больше не будет
            отправляться. Вы сможете подключить её снова в любой момент.
          </ConfirmText>
        </BaseModal>
      )}

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} $type={toast.type}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "⚠"}
            <span>{toast.message}</span>
          </Toast>
        ))}
      </ToastContainer>
    </BackupPage>
  );
};

const ExcelFileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 2.8h8l4 4V21H6Z" />
    <path d="M14 2.8V7h4" />
    <path d="m8.7 11 4.6 6M13.3 11l-4.6 6" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5h.01" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
  </svg>
);

const BackupPage = styled.section`
  width: 100%;
  padding: 26px 0 24px;
  color: #172033;
  text-align: left;
`;

const PageHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIcon = styled.div`
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #e8f7f8;
  color: #008b98;

  svg {
    width: 29px;
    height: 29px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
`;

const PageSubtitle = styled.p`
  margin: 6px 0 0;
  color: #718096;
  font-size: 15px;
  line-height: 1.45;
`;

const InfoBanner = styled.div`
  min-height: 48px;
  margin-top: 26px;
  padding: 11px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  border: 1px solid #d8edef;
  border-radius: 8px;
  background: #edf9fa;
  color: #687893;
  font-size: 13px;

  svg {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    fill: none;
    stroke: #008b98;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const ChannelsHeader = styled.div`
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ChannelsTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
`;

const ConnectedCount = styled.span`
  color: #7a869d;
  font-size: 13px;
`;

const CardsGrid = styled.div`
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const StateMessage = styled.div<{ $error?: boolean }>`
  margin-top: 18px;
  padding: 18px;
  border: 1px solid ${({ $error }) => ($error ? "#fecaca" : "#dfe6ec")};
  border-radius: 8px;
  background: ${({ $error }) => ($error ? "#fff1f2" : "#fff")};
  color: ${({ $error }) => ($error ? "#b42318" : "#667085")};
  font-size: 13px;
`;

const ScheduleNote = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #718096;
  font-size: 13px;

  svg {
    width: 21px;
    height: 21px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const ConfirmText = styled.p`
  margin: 0;
  padding: 18px 30px;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
`;

const ToastContainer = styled.div`
  position: fixed;
  z-index: 1100;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  min-width: 260px;
  max-width: 390px;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 8px;
  background: ${({ $type }) =>
    $type === "success" ? "#0f9f84" : $type === "error" ? "#dc2626" : "#d97706"};
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  color: #fff;
  font-size: 13px;
`;

export default ExcellBackupPage;
