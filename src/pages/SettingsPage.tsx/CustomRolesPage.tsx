import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomTable from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import CustomRoleModal from "../../components/modal/CrudInherited/CustomRoleModal";
import { usePermission } from "../../api/hooks/usePermission";
import type { CustomRole, CustomRolePayload } from "../../api/types/employee";
import { CUSTOM_ROLE_BASE_OPTIONS } from "../../api/constants/permissions";

const baseRoleLabel = (value: string): string =>
  CUSTOM_ROLE_BASE_OPTIONS.find((o) => o.value === value)?.label ?? value;

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

  const loadRoles = useCallback(async () => {
    try {
      await fetchCustomRoles(true); // с правами: нужны для счётчика и предзаполнения чекбоксов
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
        message.success("Роль создана");
      } else if (selectedRole) {
        await updateCustomRole(selectedRole.id, payload);
        message.success("Роль обновлена");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Ошибка при сохранении роли:", err);
      message.error("Не удалось сохранить роль");
    }
  };

  const handleDelete = async (rowData: any[]) => {
    const id = Number(rowData[0]);
    const role = customRoles.find((r) => r.id === id);
    if (!role) return;

    if (window.confirm(`Удалить роль «${role.name}»?`)) {
      try {
        await deleteCustomRole(id);
        message.success("Роль удалена");
      } catch (err) {
        console.error("Ошибка при удалении роли:", err);
        message.error("Не удалось удалить роль");
      }
    }
  };

  const tableData = customRoles.map((role) => [
    role.id.toString(),
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {role.name}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(role);
        }}
        style={{
          background: "none",
          border: "none",
          color: "#1890ff",
          cursor: "pointer",
        }}
      >
        <EditOutlined />
      </button>
    </div>,
    role.description || "-",
    baseRoleLabel(role.role),
    (role.permissions?.length ?? 0).toString(),
  ]);

  const getActions = (rowData: any[]) => [
    {
      label: "Удалить",
      action: handleDelete,
      color: "#EF4444",
    },
  ];

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
            { name: "ID", align: "center" },
            { name: "Название", align: "left" },
            { name: "Описание", align: "left" },
            { name: "Базовая роль", align: "left" },
            { name: "Прав", align: "center" },
          ]}
          data={tableData}
          contextMenuActions={getActions}
          onRowDoubleClick={(rowData: any[]) => {
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
    </PageLayout>
  );
};

export default CustomRolesPage;
