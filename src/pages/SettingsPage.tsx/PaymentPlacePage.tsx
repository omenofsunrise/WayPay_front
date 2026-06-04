import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

import type {
  PaymentPlace,
  CreatePaymentPlaceRequest,
} from "../../api/types/paymentPlace";
import usePaymentPlace from "../../api/hooks/usePaymentPlace";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomTable, {
  type Column,
  type TableAction,
} from "../../components/ui/tables/CustomTable";
import CustomInput from "../../components/ui/fields/CustomInput";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";

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

  // Активные (не удалённые) пункты
  const activePlaces = useMemo(
    () => paymentPlaces.filter((place) => !place.isDeleted),
    [paymentPlaces]
  );

  // Пункт, ожидающий оплаты — пока он есть, показываем экран оплаты вместо CRUD
  const pendingPlace = useMemo(
    () => activePlaces.find((place) => !place.payed) ?? null,
    [activePlaces]
  );

  useEffect(() => {
    getPaymentPlaces();
  }, [getPaymentPlaces]);

  // Polling статуса оплаты раз в 10 секунд, пока есть неоплаченный пункт
  useEffect(() => {
    if (!pendingPlace) return;

    const intervalId = setInterval(() => {
      getPaymentPlaces(true);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [pendingPlace, getPaymentPlaces]);

  const columns: Column[] = [
    { name: "Название", align: "left" },
    { name: "Телефон", align: "center" },
    { name: "Статус", align: "center" },
    { name: "Создан", align: "center" },
  ];

  const tableData = activePlaces.map((place) => [
    place.name,
    place.phone,
    place.payed ? "Оплачен" : "Ожидает оплаты",
    formatDate(place.createdAt),
  ]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedPlace(null);
    setFormData(emptyForm);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rowIndex: number) => {
    const place = activePlaces[rowIndex];
    if (!place) return;
    setModalMode("edit");
    setSelectedPlace(place);
    setFormData({ name: place.name, phone: place.phone });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    const place = activePlaces[rowIndex];
    if (!place) return;
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить пункт приёма «${place.name}»?`
      )
    )
      return;

    try {
      await deletePaymentPlace(place.id);
    } catch (err) {
      console.error("Ошибка при удалении пункта приёма:", err);
    }
  };

  const contextMenuActions: TableAction[] = [
    {
      label: "Редактировать",
      action: (_rowData, rowIndex) => handleEdit(rowIndex),
      color: "#007D88",
    },
    {
      label: "Удалить",
      action: (_rowData, rowIndex) => handleDelete(rowIndex),
      color: "#dc2626",
    },
  ];

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
      } else if (selectedPlace) {
        await updatePaymentPlace(selectedPlace.id, formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Здесь ловим в т.ч. 400 "Этот номер занят!"
      setModalError(
        err instanceof Error ? err.message : "Не удалось сохранить пункт приёма"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    if (!pendingPlace) return;
    if (
      !window.confirm("Отменить создание и удалить неоплаченный пункт приёма?")
    )
      return;
    try {
      await deletePaymentPlace(pendingPlace.id);
    } catch (err) {
      console.error("Ошибка при отмене пункта приёма:", err);
    }
  };

  // ===== Экран ожидания оплаты =====
  if (pendingPlace) {
    const isExpired = pendingPlace.paymentExpiresAt
      ? new Date(pendingPlace.paymentExpiresAt).getTime() < Date.now()
      : false;

    return (
      <PageContainer>
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

            {error && <ErrorMessage>{error}</ErrorMessage>}
          </PaymentCard>
        </PaymentScreen>
      </PageContainer>
    );
  }

  // ===== Основной CRUD =====
  return (
    <PageContainer>
      <PageHeader>
        <Title>Пункты приёма платежей</Title>
        <CreateButton onClick={handleCreate}>+ Добавить пункт</CreateButton>
      </PageHeader>

      {error && (
        <ErrorMessage onClick={clearError} style={{ cursor: "pointer" }}>
          {error}
        </ErrorMessage>
      )}

      <TableContainer>
        <CustomTable
          columns={columns}
          data={tableData}
          contextMenuActions={contextMenuActions}
          isLoading={isLoading}
        />
      </TableContainer>

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
              <Label>Название пункта *</Label>
              <CustomInput
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Телефон *</Label>
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
    </PageContainer>
  );
};

export default PaymentPlacePage;

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: #007d88;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: #006670;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 400px;
`;

const FormContainer = styled.div`
  display: flex;
  padding: 0 25px;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  color: #374151;
`;

const ModalError = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-size: 14px;
  text-align: center;
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
  background-color: #ffffff;
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
  background-color: #007d88;
  color: white;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    background-color: #006670;
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
  background-color: #fef3c7;
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
