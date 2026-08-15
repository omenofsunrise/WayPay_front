import { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomTable, {
  type Column,
  type TableAction,
} from "../../components/ui/tables/CustomTable";
import CustomInput from "../../components/ui/fields/CustomInput";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";
import usePaymentPlace from "../../api/hooks/usePaymentPlace";
import type {
  PaymentPlace,
  CreatePaymentPlaceRequest,
} from "../../api/types/paymentPlace";

const POLLING_INTERVAL_MS = 10_000;
const emptyForm: CreatePaymentPlaceRequest = { name: "", phone: "" };

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentPlacePage = () => {
  const {
    isLoading,
    error,
    paymentPlaces,
    getPaymentPlaces,
    createPaymentPlace,
    updatePaymentPlace,
    deletePaymentPlace,
    clearError,
  } = usePaymentPlace();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedPlace, setSelectedPlace] = useState<PaymentPlace | null>(null);
  const [formData, setFormData] =
    useState<CreatePaymentPlaceRequest>(emptyForm);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isSubmitting: boolean;
  }>({ isOpen: false, message: "", onConfirm: () => {}, isSubmitting: false });

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", msg: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message: msg }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

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

  const activePlaces = useMemo(
    () => paymentPlaces.filter((p) => !p.isDeleted),
    [paymentPlaces]
  );

  const pendingPlace = useMemo(
    () => activePlaces.find((p) => !p.payed) ?? null,
    [activePlaces]
  );

  useEffect(() => {
    getPaymentPlaces();
  }, [getPaymentPlaces]);

  useEffect(() => {
    if (!pendingPlace) return;
    const id = setInterval(() => getPaymentPlaces(true), POLLING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pendingPlace, getPaymentPlaces]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedPlace(null);
    setFormData(emptyForm);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (placeId: number) => {
    const place = activePlaces.find((p) => p.id === placeId);
    if (!place) return;
    setModalMode("edit");
    setSelectedPlace(place);
    setFormData({ name: place.name, phone: place.phone });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (placeId: number) => {
    const place = activePlaces.find((p) => p.id === placeId);
    if (!place) return;
    openConfirm(`Удалить пункт приёма «${place.name}»?`, async () => {
      try {
        await deletePaymentPlace(place.id);
        addToast("success", "Пункт приёма удалён");
      } catch {
        addToast("error", "Не удалось удалить пункт приёма");
      }
    });
  };

  const handleCancelPending = () => {
    if (!pendingPlace) return;
    openConfirm(
      "Отменить создание и удалить неоплаченный пункт приёма?",
      async () => {
        try {
          await deletePaymentPlace(pendingPlace.id);
          addToast("success", "Пункт приёма удалён");
        } catch {
          addToast("error", "Не удалось удалить пункт приёма");
        }
      }
    );
  };

  const handleInputChange = (
    field: keyof CreatePaymentPlaceRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (modalError) setModalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Укажите название пункта приёма");
      return;
    }
    if (!formData.phone.trim()) {
      setModalError("Укажите номер телефона");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      if (modalMode === "create") {
        await createPaymentPlace(formData);
        addToast("success", "Пункт приёма успешно добавлен");
      } else if (selectedPlace) {
        await updatePaymentPlace(selectedPlace.id, formData);
        addToast("success", "Пункт приёма обновлён");
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Не удалось сохранить пункт приёма"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column[] = [
    { name: "id", isHidden: true },
    { name: "Название", align: "left" },
    { name: "Телефон", align: "center" },
    { name: "Статус", align: "center" },
    { name: "Создан", align: "center" },
  ];

  const tableData = activePlaces.map((place) => [
    place.id.toString(),
    place.name,
    place.phone,
    place.payed ? "Оплачен" : "Ожидает оплаты",
    formatDate(place.createdAt),
  ]);

  const contextMenuActions: TableAction[] = [
    {
      label: "Редактировать",
      action: (rowData: any[]) => handleEdit(Number(rowData[0])),
      color: "#007D88",
    },
    {
      label: "Удалить",
      action: (rowData: any[]) => handleDelete(Number(rowData[0])),
      color: "#EF4444",
      dividerBefore: true,
    },
  ];

  // ─── Экран ожидания оплаты ─────────────────────────────────────────────────
  if (pendingPlace) {
    const isExpired = pendingPlace.paymentExpiresAt
      ? new Date(pendingPlace.paymentExpiresAt).getTime() < Date.now()
      : false;

    return (
      <PageLayout>
        <PaymentScreen>
          <PaymentCard>
            <PaymentTitle>Ожидаем оплату подписки</PaymentTitle>
            <PaymentText>
              Пункт приёма платежей <strong>«{pendingPlace.name}»</strong>{" "}
              создан. Для активации необходимо оплатить подписку.
            </PaymentText>

            {pendingPlace.paymentExpiresAt && (
              <PaymentMeta>
                Оплатить до:{" "}
                <strong>{formatDate(pendingPlace.paymentExpiresAt)}</strong>
              </PaymentMeta>
            )}

            {isExpired ? (
              <ExpiredNotice>
                Срок оплаты истёк. Удалите этот пункт и создайте новый.
              </ExpiredNotice>
            ) : (
              <>
                {pendingPlace.paymentUrl && (
                  <PayButton
                    href={pendingPlace.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Перейти к оплате
                  </PayButton>
                )}
                <PollingStatus>
                  <Spinner />
                  Проверяем статус оплаты автоматически каждые 10 секунд…
                </PollingStatus>
              </>
            )}

            <CancelLink type="button" onClick={handleCancelPending}>
              Отменить и удалить пункт
            </CancelLink>

            {error && <PageErrorMessage>{error}</PageErrorMessage>}
          </PaymentCard>
        </PaymentScreen>

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
            saveButtonText="Подтвердить"
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
  }

  // ─── Основной CRUD ─────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>
          Пункты приёма платежей
        </CustomTitle>
        <DarkCyanButton
          style={{ width: "15vw", marginLeft: "auto" }}
          onClick={handleCreate}
        >
          + Добавить пункт
        </DarkCyanButton>
      </TitleField>

      {error && (
        <PageErrorMessage onClick={clearError} $clickable>
          {error}
        </PageErrorMessage>
      )}

      <CustomTable
        columns={columns}
        data={tableData}
        contextMenuActions={contextMenuActions}
        isLoading={isLoading}
        onRowDoubleClick={(rowData) => handleEdit(Number(rowData[0]))}
      />

      {isModalOpen && (
        <BaseModal
          title={
            modalMode === "create"
              ? "Добавление пункта приёма"
              : "Редактирование пункта приёма"
          }
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onSave={handleSubmit}
          isSubmitting={isSubmitting}
          isSaveDisabled={isSubmitting}
          width="520px"
        >
          <FormContainer>
            <FormGroup>
              <FormLabel>
                Название пункта <Required>*</Required>
              </FormLabel>
              <CustomInput
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>
                Телефон <Required>*</Required>
              </FormLabel>
              <PhoneModalInput
                name="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </FormGroup>

            {modalError && <ModalError>{modalError}</ModalError>}
          </FormContainer>
        </BaseModal>
      )}

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

// ─── Styled components ─────────────────────────────────────────────────────────

const PageErrorMessage = styled.div<{ $clickable?: boolean }>`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
  font-size: 14px;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 25px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const ModalError = styled.div`
  background: #fef2f2;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-size: 13px;
`;

const PaymentScreen = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const PaymentCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 480px;
  width: 100%;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
`;

const PaymentTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PaymentText = styled.p`
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
  margin: 0;
`;

const PaymentMeta = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const PayButton = styled.a`
  display: inline-block;
  background: #007d88;
  color: white;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #006670;
  }
`;

const PollingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #6b7280;
`;

const ExpiredNotice = styled.div`
  background: #fef3c7;
  color: #92400e;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #fde68a;
  font-size: 14px;
`;

const CancelLink = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.15s;

  &:hover {
    color: #dc2626;
  }
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-top-color: #007d88;
  border-radius: 50%;
  display: inline-block;
  animation: ppl-spin 0.8s linear infinite;

  @keyframes ppl-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default PaymentPlacePage;
