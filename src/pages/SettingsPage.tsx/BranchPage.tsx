import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomTable, {
  type Column,
} from "../../components/ui/tables/CustomTable";
import CustomInput from "../../components/ui/fields/CustomInput";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";
import Checkbox from "../../components/ui/CheckBoxes/Checkbox";
import YandexMapSelector from "../../components/YandexMapSelector";
import useBranch from "../../api/hooks/useBranch";
import type {
  BranchWithCoordinatesResponse,
  CreateBranchRequest,
  UpdateBranchRequest,
  WorkScheduleRequest,
} from "../../api/types/branch";
import {
  daysOfWeek,
  formatTimeForInput,
  formatTimeForApi,
} from "../../api/types/branch";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayName(day: string): string {
  const map: Record<string, string> = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
    Saturday: "Суббота",
    Sunday: "Воскресенье",
  };
  return map[day] || day;
}

const defaultSchedules = () =>
  daysOfWeek.map((day) => ({
    dayOfWeek: day,
    openTime: "09:00:00",
    closeTime: "18:00:00",
    isWorking: day !== "Sunday",
  }));

// ─── Component ────────────────────────────────────────────────────────────────

const BranchPage = () => {
  const {
    isLoading,
    error,
    myBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getMyBranches,
  } = useBranch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBranch, setSelectedBranch] =
    useState<BranchWithCoordinatesResponse | null>(null);
  const [formData, setFormData] = useState<CreateBranchRequest>({
    name: "",
    address: "",
    phone: "",
    latitude: 0,
    longitude: 0,
    schedules: defaultSchedules(),
  });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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

  useEffect(() => {
    getMyBranches();
  }, [getMyBranches]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      latitude: 0,
      longitude: 0,
      schedules: defaultSchedules(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (branchId: number) => {
    const branch = myBranches.find((b) => b.id === branchId);
    if (!branch) return;
    setModalMode("edit");
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      latitude: branch.latitude,
      longitude: branch.longitude,
      schedules: branch.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
        isWorking: s.isWorking,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (branchId: number) => {
    const branch = myBranches.find((b) => b.id === branchId);
    if (!branch) return;
    openConfirm(`Удалить отделение «${branch.name}»?`, async () => {
      try {
        await deleteBranch(branch.id);
        addToast("success", "Отделение удалено");
      } catch {
        addToast("error", "Не удалось удалить отделение");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await createBranch(formData);
        addToast("success", "Отделение успешно добавлено");
      } else if (selectedBranch) {
        await updateBranch(selectedBranch.id, formData as UpdateBranchRequest);
        addToast("success", "Отделение успешно обновлено");
      }
      setIsModalOpen(false);
    } catch {
      addToast("error", "Не удалось сохранить отделение");
    }
  };

  const handleInputChange = (field: keyof CreateBranchRequest, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleScheduleChange = (
    dayIndex: number,
    field: keyof WorkScheduleRequest,
    value: any
  ) =>
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) =>
        i === dayIndex ? { ...s, [field]: value } : s
      ),
    }));

  const handleTimeChange = (
    dayIndex: number,
    field: "openTime" | "closeTime",
    timeValue: string
  ) => handleScheduleChange(dayIndex, field, formatTimeForApi(timeValue));

  const handleMapSelect = (address: string, lat: number, lon: number) =>
    setFormData((prev) => ({
      ...prev,
      address,
      latitude: lat,
      longitude: lon,
    }));

  const columns: Column[] = [
    { name: "id", isHidden: true },
    { name: "Название", align: "left" },
    { name: "Адрес", align: "left" },
    { name: "Телефон", align: "center" },
  ];

  const tableData = myBranches.map((branch) => [
    branch.id.toString(),
    branch.name,
    branch.address,
    branch.phone,
  ]);

  const contextMenuActions = [
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

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>
          Управление отделениями
        </CustomTitle>
        <DarkCyanButton
          style={{ width: "15vw", marginLeft: "auto" }}
          onClick={handleCreate}
        >
          + Добавить отделение
        </DarkCyanButton>
      </TitleField>

      {error && <ErrorMessage>{error}</ErrorMessage>}

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
              ? "Добавление отделения"
              : "Редактирование отделения"
          }
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onSave={handleSubmit}
          width="900px"
        >
          <FormContainer>
            <FormGrid>
              <FormGroup>
                <FormLabel>
                  Название отделения <Required>*</Required>
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
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </FormGroup>
            </FormGrid>

            <AddressSection>
              <AddressHeader>
                <FormLabel>
                  Адрес отделения <Required>*</Required>
                </FormLabel>
                <MapButton
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                >
                  Выбрать на карте
                </MapButton>
              </AddressHeader>
              <AddressInfo>
                <span>
                  Адрес: <strong>{formData.address || "Не выбран"}</strong>
                </span>
              </AddressInfo>
            </AddressSection>

            <ScheduleSection>
              <ScheduleTitle>Режим работы</ScheduleTitle>
              {formData.schedules.map((schedule, index) => (
                <ScheduleRow key={schedule.dayOfWeek}>
                  <DayLabel>
                    <Checkbox
                      checked={schedule.isWorking}
                      onChange={(checked) =>
                        handleScheduleChange(index, "isWorking", checked)
                      }
                      label={getDayName(schedule.dayOfWeek)}
                    />
                  </DayLabel>
                  <TimeInputs>
                    <TimeInput
                      type="time"
                      value={formatTimeForInput(schedule.openTime)}
                      onChange={(e) =>
                        handleTimeChange(index, "openTime", e.target.value)
                      }
                      disabled={!schedule.isWorking}
                    />
                    <TimeSeparator>—</TimeSeparator>
                    <TimeInput
                      type="time"
                      value={formatTimeForInput(schedule.closeTime)}
                      onChange={(e) =>
                        handleTimeChange(index, "closeTime", e.target.value)
                      }
                      disabled={!schedule.isWorking}
                    />
                  </TimeInputs>
                </ScheduleRow>
              ))}
            </ScheduleSection>
          </FormContainer>
        </BaseModal>
      )}

      {isMapModalOpen && (
        <BaseModal
          title="Выберите расположение отделения"
          onClose={() => setIsMapModalOpen(false)}
          onCancel={() => setIsMapModalOpen(false)}
          onSave={() => setIsMapModalOpen(false)}
          saveButtonText="Готово"
          width="800px"
        >
          <YandexMapSelector
            onLocationSelect={handleMapSelect}
            initialAddress={formData.address}
            initialLat={formData.latitude}
            initialLon={formData.longitude}
          />
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

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
  font-size: 14px;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 25px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

const AddressSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const MapButton = styled.button`
  background: #007d88;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: #006670;
  }
`;

const AddressInfo = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
`;

const ScheduleSection = styled.div`
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
`;

const ScheduleTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
`;

const ScheduleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DayLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
`;

const TimeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeInput = styled.input`
  padding: 5px 12px 5px 15px;
  border: 1px solid rgba(156, 163, 175, 1);
  border-radius: 5px;
  font-size: 14px;
  min-height: 38px;
  box-sizing: border-box;
  background: white;
  color: black;
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }

  &:focus {
    outline: none;
    border-color: rgba(0, 125, 136, 1);
  }

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    border-color: rgba(209, 213, 219, 1);
    &:hover {
      border-color: rgba(209, 213, 219, 1);
    }
  }
`;

const TimeSeparator = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

export default BranchPage;
