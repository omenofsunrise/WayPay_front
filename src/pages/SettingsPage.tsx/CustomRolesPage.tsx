import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomTable from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomRoleModal from "../../components/modal/CrudInherited/CustomRoleModal";
import { usePermission } from "../../api/hooks/usePermission";
import type { CustomRole, CustomRolePayload } from "../../api/types/employee";
import { CUSTOM_ROLE_BASE_OPTIONS } from "../../api/constants/permissions";

const baseRoleLabel = (value: string): string =>
  CUSTOM_ROLE_BASE_OPTIONS.find((o) => o.value === value)?.label ?? value;

// ─── Toast ────────────────────────────────────────────────────────────────────

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
  max-width: 400px;
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

// ─── Styled components ─────────────────────────────────────────────────────────

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ─── Component ─────────────────────────────────────────────────────────────────

const CustomRolesPage = () => {
  const {
    customRoles,
    loading,
    error,
    saving,
    fetchCustomRoles,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
  } = usePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = (type: "success" | "error" | "warning", msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message: msg }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  };

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isSubmitting: boolean;
  }>({ isOpen: false, message: "", onConfirm: () => {}, isSubmitting: false });

  const openConfirm = (msg: string, onConfirm: () => void) =>
    setConfirmState({
      isOpen: true,
      message: msg,
      onConfirm,
      isSubmitting: false,
    });

  const closeConfirm = () =>
    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
      isSubmitting: false,
    }));

  const handleConfirm = async () => {
    setConfirmState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await confirmState.onConfirm();
    } finally {
      closeConfirm();
    }
  };

  const loadRoles = useCallback(async () => {
    try {
      await fetchCustomRoles(true);
    } catch {
      // ошибка показывается через error
    }
  }, [fetchCustomRoles]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: CustomRole) => {
    setModalMode("edit");
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: CustomRolePayload) => {
    try {
      if (modalMode === "create") {
        await createCustomRole(payload);
        addToast("success", "Роль успешно создана");
      } else if (selectedRole) {
        await updateCustomRole(selectedRole.id, payload);
        addToast("success", "Роль успешно обновлена");
      }
      setIsModalOpen(false);
    } catch {
      addToast("error", "Не удалось сохранить роль");
    }
  };

  const handleDelete = (rowData: any[]) => {
    const id = Number(rowData[0]);
    const role = customRoles.find((r) => r.id === id);
    if (!role) return;

    openConfirm(`Удалить роль «${role.name}»?`, async () => {
      try {
        await deleteCustomRole(id);
        addToast("success", "Роль удалена");
      } catch {
        addToast("error", "Не удалось удалить роль");
      }
    });
  };

  const tableData = customRoles.map((role) => [
    role.id.toString(),
    <NameCell>{role.name}</NameCell>,
    role.description || "—",
    baseRoleLabel(role.role),
    (role.permissions?.length ?? 0).toString(),
  ]);

  const getActions = (rowData: any[]) => {
    const role = customRoles.find((r) => r.id === Number(rowData[0]));
    return [
      {
        label: "Редактировать",
        action: () => role && handleEdit(role),
        color: "#007D88",
      },
      {
        label: "Удалить",
        action: handleDelete,
        color: "#EF4444",
        dividerBefore: true,
      },
    ];
  };

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>Кастомные роли</CustomTitle>
      </TitleField>

      <FilterField>
        <DarkCyanButton
          style={{ width: "15vw", marginLeft: "auto" }}
          onClick={handleCreate}
        >
          + Новая роль
        </DarkCyanButton>
      </FilterField>

      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}

      {!loading && !error && (
        <CustomTable
          columns={[
            { name: "ID", isHidden: true },
            { name: "Название", align: "left" },
            { name: "Описание", align: "left" },
            { name: "Базовая роль", align: "left" },
            { name: "Прав", align: "center" },
          ]}
          data={tableData}
          contextMenuActions={getActions}
          onRowDoubleClick={(rowData) => {
            const role = customRoles.find((r) => r.id === Number(rowData[0]));
            if (role) handleEdit(role);
          }}
        />
      )}

      <CustomRoleModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedRole}
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
          width="400px"
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

export default CustomRolesPage;
