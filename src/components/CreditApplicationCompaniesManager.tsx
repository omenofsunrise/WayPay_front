import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import type { CreditApplicationUsersResponse } from "../api/types/applicationUser";
import useAdminPanel from "../api/hooks/useAdminPanel";
import { formatPhoneHref } from "../utils/phoneUtils";
import PhoneLink from "./ui/links/PhoneLink";
import CustomTable from "./ui/tables/CustomTable";
import BaseModal from "./modal/BASE/modalCRUBase";
import CustomInput from "./ui/fields/CustomInput";
import CustomPhoneInput from "./ui/fields/PhoneInput";

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ModalLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const ModalError = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 13px;
`;

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
  min-width: 300px;
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

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  isSubmitting: boolean;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  name,
  isSubmitting,
}: DeleteModalProps) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input !== name) {
      setError("Название не совпадает");
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setInput("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Удаление заявкополучателя"
      onClose={handleClose}
      onCancel={handleClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <ModalForm>
        <ModalField>
          <ModalLabel>
            Для подтверждения введите название: <strong>{name}</strong>
          </ModalLabel>
          <CustomInput
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Название"
          />
        </ModalField>
        {error && <ModalError>{error}</ModalError>}
      </ModalForm>
    </BaseModal>
  );
};

interface Props {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
}

const CreditApplicationCompaniesManager = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
}: Props) => {
  const {
    creditApplicationCompanies,
    isLoading,
    error,
    fetchCreditApplicationCompanies,
    createCreditApplicationCompany,
    updateCreditApplicationCompany,
    deleteCreditApplicationCompany,
  } = useAdminPanel();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CreditApplicationUsersResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  useEffect(() => {
    fetchCreditApplicationCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyPhone.trim()) {
      addToast("warning", "Заполните все поля");
      return;
    }
    setIsSaving(true);
    try {
      const success = await createCreditApplicationCompany(
        companyName,
        companyPhone
      );
      if (success) {
        setIsCreateModalOpen(false);
        setCompanyName("");
        setCompanyPhone("");
        addToast("success", "Заявкополучатель успешно добавлен");
      } else {
        addToast("error", "Ошибка при добавлении");
      }
    } catch (err) {
      console.error("Ошибка:", err);
      addToast("error", "Произошла ошибка");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsSaving(true);
    try {
      const success = await updateCreditApplicationCompany(
        selectedCompany.id,
        companyName || undefined,
        companyPhone || undefined
      );
      if (success) {
        setIsEditModalOpen(false);
        setSelectedCompany(null);
        setCompanyName("");
        setCompanyPhone("");
        addToast("success", "Заявкополучатель успешно обновлён");
      } else {
        addToast("error", "Ошибка при обновлении");
      }
    } catch (err) {
      console.error("Ошибка:", err);
      addToast("error", "Произошла ошибка");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;
    setIsSaving(true);
    try {
      const success = await deleteCreditApplicationCompany(selectedCompany.id);
      if (success) {
        setIsDeleteModalOpen(false);
        setSelectedCompany(null);
        addToast("success", "Заявкополучатель успешно удалён");
      } else {
        addToast("error", "Ошибка при удалении");
      }
    } catch (err) {
      console.error("Ошибка:", err);
      addToast("error", "Произошла ошибка");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (company: CreditApplicationUsersResponse) => {
    setSelectedCompany(company);
    setCompanyName(company.name);
    setCompanyPhone(company.phone);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (company: CreditApplicationUsersResponse) => {
    setSelectedCompany(company);
    setIsDeleteModalOpen(true);
  };

  // Первая колонка — скрытый id, нужен для поиска записи в обработчиках
  const columns = [
    { name: "id", isHidden: true },
    { name: "Название", align: "left" as const },
    { name: "Телефон", align: "left" as const },
  ];

  const tableData = creditApplicationCompanies.map((company) => [
    company.id,
    company.name,
    <PhoneLink href={formatPhoneHref(company.phone)}>
      {company.phone}
    </PhoneLink>,
  ]);

  const rowActions = [
    {
      label: "Редактировать",
      action: (rowData: any[]) => {
        const company = creditApplicationCompanies.find(
          (c) => c.id === rowData[0]
        );
        if (company) openEditModal(company);
      },
      color: "#3B82F6",
    },
    {
      label: "Удалить",
      action: (rowData: any[]) => {
        const company = creditApplicationCompanies.find(
          (c) => c.id === rowData[0]
        );
        if (company) openDeleteModal(company);
      },
      color: "#EF4444",
    },
  ];

  if (isLoading && creditApplicationCompanies.length === 0) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Ошибка: {error}</div>;
  }

  return (
    <>
      <CustomTable
        columns={columns}
        data={tableData}
        contextMenuActions={rowActions}
      />

      {isCreateModalOpen && (
        <BaseModal
          title="Добавление заявкополучателя"
          onClose={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
          isSubmitting={isSaving}
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Название</ModalLabel>
              <CustomInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Введите название"
              />
            </ModalField>
            <ModalField>
              <ModalLabel>Телефон</ModalLabel>
              <CustomPhoneInput
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e)}
                placeholder="Введите телефон"
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      {isEditModalOpen && selectedCompany && (
        <BaseModal
          title={`Редактирование: ${selectedCompany.name}`}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setCompanyName("");
            setCompanyPhone("");
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setCompanyName("");
            setCompanyPhone("");
          }}
          onSave={handleUpdate}
          isSubmitting={isSaving}
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Название</ModalLabel>
              <CustomInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Введите название"
              />
            </ModalField>
            <ModalField>
              <ModalLabel>Телефон</ModalLabel>
              <CustomPhoneInput
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e)}
                placeholder="Введите телефон"
              />
            </ModalField>
          </ModalForm>
        </BaseModal>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCompany(null);
        }}
        onConfirm={handleDeleteConfirm}
        name={selectedCompany?.name ?? ""}
        isSubmitting={isSaving}
      />

      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
};

export default CreditApplicationCompaniesManager;
