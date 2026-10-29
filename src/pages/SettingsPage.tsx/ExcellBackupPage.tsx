import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomTable from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import ExcellBackupSubscriptionModal from "../../components/modal/CrudInherited/ExcellBackupSubscriptionModal";
import useExcellBackupSubscription from "../../api/hooks/useExcellBackupSubscription";
import type {
  ExcellBackupSubscription,
  ExcellBackupSubscriptionPayload,
} from "../../api/types/excellBackup";
import {
  BACKUP_ITEM,
  hasItem,
  messengerLabel,
} from "../../api/types/excellBackup";
import { extractErrorMessage } from "../../api/utils/errorMessage";

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

const ConfirmText = styled.p`
  padding: 16px 30px;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
`;

const CenteredCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EnabledMark = styled.span`
  color: #10b981;
  font-weight: 700;
`;

const DisabledMark = styled.span`
  color: #cbd5e1;
`;

const EmptyState = styled.div`
  margin-top: 24px;
  padding: 32px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
`;

// ─── Component ─────────────────────────────────────────────────────────────────

const ExcellBackupPage = () => {
  const {
    subscriptions,
    loading,
    error,
    saving,
    fetchAll,
    createSubscription,
    updateSubscription,
    addItem,
    removeItem,
    deleteSubscription,
  } = useExcellBackupSubscription();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSub, setSelectedSub] = useState<ExcellBackupSubscription | null>(
    null
  );

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

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isSubmitting: boolean;
  }>({ isOpen: false, message: "", onConfirm: () => {}, isSubmitting: false });

  const openConfirm = (msg: string, onConfirm: () => void) =>
    setConfirmState({ isOpen: true, message: msg, onConfirm, isSubmitting: false });

  const closeConfirm = () =>
    setConfirmState((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));

  const handleConfirm = async () => {
    setConfirmState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await confirmState.onConfirm();
    } finally {
      closeConfirm();
    }
  };

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

  const handleCreate = () => {
    setModalMode("create");
    setSelectedSub(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sub: ExcellBackupSubscription) => {
    setModalMode("edit");
    setSelectedSub(sub);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: ExcellBackupSubscriptionPayload) => {
    try {
      if (modalMode === "create") {
        await createSubscription(payload);
        addToast("success", "Подписка создана");
      } else if (selectedSub) {
        await updateSubscription(selectedSub.id, payload);
        addToast("success", "Подписка обновлена");
      }
      setIsModalOpen(false);
    } catch (e) {
      addToast("error", extractErrorMessage(e, "Не удалось сохранить подписку"));
    }
  };

  const handleDelete = (rowData: any[]) => {
    const id = Number(rowData[0]);
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;

    openConfirm(
      `Удалить подписку для «${sub.contact}» (${messengerLabel(sub.messenger)})?`,
      async () => {
        try {
          await deleteSubscription(id);
          addToast("success", "Подписка удалена");
        } catch (e) {
          addToast("error", extractErrorMessage(e, "Не удалось удалить подписку"));
        }
      }
    );
  };

  const handleToggleItem = async (
    sub: ExcellBackupSubscription,
    flag: number,
    item: "Credits" | "Clients"
  ) => {
    try {
      if (hasItem(sub.items, flag)) {
        await removeItem(sub.id, item);
        addToast("success", `${item} отключён`);
      } else {
        await addItem(sub.id, item);
        addToast("success", `${item} включён`);
      }
    } catch (e) {
      addToast("error", extractErrorMessage(e, "Не удалось изменить подписку"));
    }
  };

  const tableData = subscriptions.map((sub) => [
    sub.id.toString(),
    messengerLabel(sub.messenger),
    sub.contact,
    <CenteredCell>
      {hasItem(sub.items, BACKUP_ITEM.Credits) ? (
        <EnabledMark>✓</EnabledMark>
      ) : (
        <DisabledMark>—</DisabledMark>
      )}
    </CenteredCell>,
    <CenteredCell>
      {hasItem(sub.items, BACKUP_ITEM.Clients) ? (
        <EnabledMark>✓</EnabledMark>
      ) : (
        <DisabledMark>—</DisabledMark>
      )}
    </CenteredCell>,
  ]);

  const getActions = (rowData: any[]) => {
    const sub = subscriptions.find((s) => s.id === Number(rowData[0]));
    if (!sub) return [];

    const items: {
      label: string;
      action: () => void;
      color?: string;
      dividerBefore?: boolean;
    }[] = [
      {
        label: "Редактировать",
        action: () => handleEdit(sub),
        color: "#007D88",
      },
    ];

    if (hasItem(sub.items, BACKUP_ITEM.Clients)) {
      items.push({
        label: "Отключить клиентов",
        action: () => handleToggleItem(sub, BACKUP_ITEM.Clients, "Clients"),
        color: "#F59E0B",
      });
    } else {
      items.push({
        label: "Включить клиентов",
        action: () => handleToggleItem(sub, BACKUP_ITEM.Clients, "Clients"),
        color: "#10B981",
      });
    }

    items.push({
      label: "Удалить",
      action: () => handleDelete(rowData),
      color: "#EF4444",
      dividerBefore: true,
    });

    return items;
  };

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>Excel-бэкапы</CustomTitle>
      </TitleField>

      <FilterField>
        <DarkCyanButton
          style={{ width: "15vw", marginLeft: "auto" }}
          onClick={handleCreate}
        >
          + Новая подписка
        </DarkCyanButton>
      </FilterField>

      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}

      {!loading && !error && subscriptions.length === 0 && (
        <EmptyState>
          Пока нет активных подписок.
          <br />
          Создайте подписку на бекап — и выбранные данные будут автоматически выгружаться
          в Excel каждый день ночью
        </EmptyState>
      )}

      {!loading && !error && subscriptions.length > 0 && (
        <CustomTable
          columns={[
            { name: "ID", isHidden: true },
            { name: "Мессенджер", align: "left" },
            { name: "Контакт", align: "left" },
          ]}
          data={tableData}
          contextMenuActions={getActions}
          onRowDoubleClick={(rowData) => {
            const sub = subscriptions.find((s) => s.id === Number(rowData[0]));
            if (sub) handleEdit(sub);
          }}
        />
      )}

      <ExcellBackupSubscriptionModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedSub}
        isSubmitting={saving}
      />

      {confirmState.isOpen && (
        <BaseModal
          title="Подтверждение"
          onClose={closeConfirm}
          onCancel={closeConfirm}
          onSave={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          isSubmitting={confirmState.isSubmitting}
          saveButtonText="Удалить"
          width="420px"
        >
          <ConfirmText>{confirmState.message}</ConfirmText>
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