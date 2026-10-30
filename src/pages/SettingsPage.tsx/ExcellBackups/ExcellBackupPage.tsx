import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import PageLayout from "../../../components/ui/Layouts/PageLayout";
import TitleField from "../../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../../components/ui/Text/CustomTitle";
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

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 280px;
  max-width: 420px;
  background: ${(p) =>
    p.$type === "success"
      ? "#10b981"
      : p.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const Hint = styled.p`
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  max-width: 720px;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-top: 24px;
`;

const ConfirmText = styled.p`
  padding: 16px 30px;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
`;

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

  const addToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  const [confirmMessenger, setConfirmMessenger] = useState<Messenger | null>(
    null
  );
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      await fetchAll();
    } catch {
      // ошибка показывается через `error`
    }
  }, [fetchAll]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Ищем подписку под конкретный мессенджер, если она включает Credits.
  // Всё, что не Credits, фронт игнорирует — пользователь об этом не знает.
  const findCreditsSub = (
    messenger: Messenger
  ): ExcellBackupSubscription | null =>
    subscriptions.find(
      (s) => s.messenger === messenger && hasItem(s.items, BACKUP_ITEM.Credits)
    ) ?? null;

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
        addToast(
          "success",
          `${messengerLabel(messenger)}: подписка подключена`
        );
      }
    } catch (e) {
      addToast("error", extractErrorMessage(e, "Не удалось сохранить подписку"));
      throw e; // пробрасываем, чтобы карточка осталась в режиме редактирования
    }
  };

  const requestDelete = (messenger: Messenger) => {
    if (!findCreditsSub(messenger)) return;
    setConfirmMessenger(messenger);
  };

  const handleConfirmDelete = async () => {
    if (!confirmMessenger) return;
    const sub = findCreditsSub(confirmMessenger);
    if (!sub) {
      setConfirmMessenger(null);
      return;
    }
    setConfirmSubmitting(true);
    try {
      await deleteSubscription(sub.id);
      addToast(
        "success",
        `${messengerLabel(confirmMessenger)}: подписка отключена`
      );
    } catch (e) {
      addToast(
        "error",
        extractErrorMessage(e, "Не удалось отключить подписку")
      );
    } finally {
      setConfirmSubmitting(false);
      setConfirmMessenger(null);
    }
  };

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>Excel-бэкапы</CustomTitle>
      </TitleField>

      <Hint>
        Настройте контакт в любом удобном мессенджере — и выгрузка в Excel
        будет приходить автоматически каждую ночь. Достаточно указать один
        контакт для любого из каналов.
      </Hint>

      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}

      {!loading && !error && (
        <CardsGrid>
          {MESSENGER_OPTIONS.map((m) => (
            <MessengerBackupCard
              key={m.value}
              messenger={m.value}
              subscription={findCreditsSub(m.value)}
              isSaving={saving}
              onSave={(contact) => handleSave(m.value, contact)}
              onDelete={() => requestDelete(m.value)}
            />
          ))}
        </CardsGrid>
      )}

      {confirmMessenger && (
        <BaseModal
          title="Отключить подписку?"
          onClose={() => setConfirmMessenger(null)}
          onCancel={() => setConfirmMessenger(null)}
          onSave={(e) => {
            e.preventDefault();
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
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </PageLayout>
  );
};

export default ExcellBackupPage;