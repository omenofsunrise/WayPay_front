import PageLayout from "../../components/ui/Layouts/PageLayout";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import ModalInfoTitle from "../../components/ui/Text/ModalInfoTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomTextArea from "../../components/ui/fields/CustomTextArea";
import useSender from "../../api/hooks/useSender";
import { TextPatternType } from "../../api/types/sender";
import type {
  CreateSenderSetting,
  SenderSettingResponse,
} from "../../api/types/sender";
import DefaultContainer from "../../components/ui/containers/defaultContainer";
import AddSenderScheduleModal from "../../components/modal/AddSenderScheduleModal";
import { describeSenderSetting } from "../../api/utils/senderSchedule";
import DeleteButton from "../../components/ui/Buttons/DeleteButton";

// ─── Toast & Confirm ──────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateKey =
  | "upcomingPaymentText"
  | "overduePaymentText"
  | "guarantorUpcomingPaymentText"
  | "guarantorOverduePaymentText"
  | "shareCreditText"
  | "shareCreditsText"
  | "sharePaymentsText";

interface Variable {
  key: string;
  label: string;
  preview: string;
}

interface TemplateConfig {
  key: TemplateKey;
  title: string;
  patternType: TextPatternType;
  variables: Variable[];
  placeholder: string;
}

type SenderSettings = Record<TemplateKey, string>;

const paymentVariables: Variable[] = [
  { key: "fullname", label: "ФИО", preview: "Иванов Иван Иванович" },
  {
    key: "guarantor_fullname",
    label: "Поручитель",
    preview: "Петров Пётр Петрович",
  },
  { key: "company", label: "Компания", preview: 'ООО "Пример"' },
  { key: "amount", label: "Сумма", preview: "15 000 ₽" },
  { key: "date", label: "Дата платежа", preview: "15.12.2024" },
  { key: "credit_date", label: "Дата договора", preview: "01.01.2024" },
  { key: "account_details", label: "Карта", preview: "**** 1234" },
  { key: "rest", label: "Остаток", preview: "50 000 ₽" },
  { key: "product", label: "Товар", preview: "Ноутбук Dell XPS 15" },
  { key: "payment_day", label: "День платежа", preview: "15 число" },
  { key: "overdue", label: "Просрочка", preview: "3 дня" },
  { key: "support_number", label: "Поддержка", preview: "+7 (999) 123-45-67" },
];

const shareCreditVariables: Variable[] = [
  { key: "name", label: "Договор", preview: "№123" },
  { key: "date", label: "Дата оформления", preview: "01.01.2024" },
  {
    key: "client_fullname",
    label: "ФИО клиента",
    preview: "Иванов Иван Иванович",
  },
  {
    key: "client_phone",
    label: "Телефон клиента",
    preview: "+7 (999) 123-45-67",
  },
  {
    key: "guarantor_fullname",
    label: "ФИО поручителя",
    preview: "Петров Пётр Петрович",
  },
  {
    key: "guarantor_phone",
    label: "Телефон поручителя",
    preview: "+7 (999) 765-43-21",
  },
  { key: "address", label: "Адрес", preview: "г. Москва, ул. Ленина, д. 1" },
  { key: "product", label: "Товар", preview: "Ноутбук Dell XPS 15" },
  { key: "terms", label: "Срок", preview: "12" },
  { key: "total_clean", label: "Стоимость товара", preview: "100 000 ₽" },
  { key: "total_amount", label: "Общая сумма", preview: "120 000 ₽" },
  { key: "first_payment", label: "Первоначальный взнос", preview: "20 000 ₽" },
  { key: "avarage_payment", label: "Средний платёж", preview: "10 000 ₽" },
  {
    key: "first_payment_date",
    label: "Дата первого платежа",
    preview: "01.02.2024",
  },
  {
    key: "last_payment_date",
    label: "Дата последнего платежа",
    preview: "01.01.2025",
  },
];

const shareCreditsVariables: Variable[] = [
  { key: "name", label: "Договор", preview: "№123" },
  {
    key: "client_fullname",
    label: "ФИО клиента",
    preview: "Иванов Иван Иванович",
  },
  { key: "date", label: "Дата", preview: "01.01.2024" },
  { key: "total_amount", label: "Сумма", preview: "120 000 ₽" },
  { key: "rest", label: "Остаток", preview: "50 000 ₽" },
];

const sharePaymentsVariables: Variable[] = [
  { key: "number", label: "Номер платежа", preview: "1" },
  { key: "date", label: "Дата", preview: "15.12.2024" },
  { key: "amount", label: "Сумма", preview: "15 000 ₽" },
  { key: "payment_type", label: "Способ оплаты", preview: "Наличные" },
  { key: "employee", label: "Сотрудник", preview: "Петров П.П." },
];

const templateConfigs: TemplateConfig[] = [
  {
    key: "upcomingPaymentText",
    title: "Текст для приближающегося платежа",
    patternType: TextPatternType.ComingPayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
Напоминаем, что {date} ожидается платеж в размере {amount} по договору от {credit_date}.
Остаток задолженности: {rest}
Товар: {product}`,
  },
  {
    key: "overduePaymentText",
    title: "Текст для просроченного платежа",
    patternType: TextPatternType.OverduePayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
У Вас просрочка платежа на {amount} с {date}.
Просрочка составляет {overdue}.
Пожалуйста, произведите оплату на карту {account_details}.
Для уточнений звоните {support_number}`,
  },
  {
    key: "guarantorUpcomingPaymentText",
    title: "Текст для приближающегося платежа (поручитель)",
    patternType: TextPatternType.GuarantorComingPayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
Напоминаем, что {date} по договору, в котором Вы выступаете поручителем, ожидается платеж в размере {amount}.
Остаток задолженности: {rest}
Товар: {product}`,
  },
  {
    key: "guarantorOverduePaymentText",
    title: "Текст для просроченного платежа (поручитель)",
    patternType: TextPatternType.GuarantorOverduePayment,
    variables: paymentVariables,
    placeholder: `Пример:
Уважаемый {fullname}!
По договору, в котором Вы выступаете поручителем, просрочка платежа на {amount} с {date}.
Просрочка составляет {overdue}.
Пожалуйста, свяжитесь с заёмщиком или произведите оплату на карту {account_details}.
Для уточнений звоните {support_number}`,
  },
  {
    key: "shareCreditText",
    title: "Текст для отправки договора",
    patternType: TextPatternType.WhatsAppCreditShare,
    variables: shareCreditVariables,
    placeholder: `Пример:
Договор {name}
Дата оформления договора: {date}
Клиент: {client_fullname}
Срок: {terms} месяцев
Стоимость товара: {total_clean} ₽
Общая сумма договора: {total_amount} ₽`,
  },
  {
    key: "shareCreditsText",
    title: "Текст для отправки списка договоров",
    patternType: TextPatternType.WhatsAppCreditsShare,
    variables: shareCreditsVariables,
    placeholder: `Пример:
*Договор {name}*
Клиент: {client_fullname}
Дата: {date}
Сумма: {total_amount} ₽
Остаток: {rest} ₽`,
  },
  {
    key: "sharePaymentsText",
    title: "Текст для отправки истории платежей",
    patternType: TextPatternType.WhatsAppSchedulesShare,
    variables: sharePaymentsVariables,
    placeholder: `Пример:
{number}. {date}    Сумма: {amount} ₽
   Способ: {payment_type}
   Сотрудник: {employee}`,
  },
];

const initialSettings: SenderSettings = {
  upcomingPaymentText: "",
  overduePaymentText: "",
  guarantorUpcomingPaymentText: "",
  guarantorOverduePaymentText: "",
  shareCreditText: "",
  shareCreditsText: "",
  sharePaymentsText: "",
};

const SenderPage = () => {
  const {
    isLoading,
    error,
    GetMyCompanySenderInfo,
    SetSenderTextPattern,
    CreateNewSenderSetting,
    DeleteSenderSetting,
  } = useSender();

  const [settings, setSettings] = useState<SenderSettings>(initialSettings);
  const [scheduleSettings, setScheduleSettings] = useState<
    SenderSettingResponse[]
  >([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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

  const [changedFlags, setChangedFlags] = useState<
    Record<TemplateKey, boolean>
  >({
    upcomingPaymentText: false,
    overduePaymentText: false,
    guarantorUpcomingPaymentText: false,
    guarantorOverduePaymentText: false,
    shareCreditText: false,
    shareCreditsText: false,
    sharePaymentsText: false,
  });

  useEffect(() => {
    loadSenderData();
  }, []);

  const loadSenderData = async () => {
    const data = await GetMyCompanySenderInfo();
    if (data) {
      setSettings({
        upcomingPaymentText: data.comingPaymentContent?.toString() || "",
        overduePaymentText: data.overduePaymentContent?.toString() || "",
        guarantorUpcomingPaymentText:
          data.guarantorComingPaymentContent?.toString() || "",
        guarantorOverduePaymentText:
          data.guarantorOverduePaymentContent?.toString() || "",
        shareCreditText: data.shareCreditContent?.toString() || "",
        shareCreditsText: data.shareCreditsContent?.toString() || "",
        sharePaymentsText: data.sharePaymentsContent?.toString() || "",
      });
      setScheduleSettings(data.senderSettingResponses ?? []);
      setChangedFlags({
        upcomingPaymentText: false,
        overduePaymentText: false,
        guarantorUpcomingPaymentText: false,
        guarantorOverduePaymentText: false,
        shareCreditText: false,
        shareCreditsText: false,
        sharePaymentsText: false,
      });
    }
  };

  const handleTextChange = (key: TemplateKey, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setChangedFlags((prev) => ({ ...prev, [key]: true }));
  };

  const handleSaveText = async (config: TemplateConfig) => {
    try {
      await SetSenderTextPattern({
        newText: settings[config.key],
        patternType: config.patternType,
      });
      setChangedFlags((prev) => ({ ...prev, [config.key]: false }));
      addToast("success", "Шаблон сохранён");
    } catch (e) {
      console.error("Error saving text pattern:", e);
      addToast("error", "Не удалось сохранить шаблон");
    }
  };

  const handleAddSchedule = async (setting: CreateSenderSetting) => {
    await CreateNewSenderSetting(setting);
    await loadSenderData();
    setIsScheduleModalOpen(false);
  };

  const handleDeleteSchedule = (id: number) => {
    openConfirm("Удалить это расписание рассылки?", async () => {
      try {
        await DeleteSenderSetting(id);
        await loadSenderData();
        addToast("success", "Расписание удалено");
      } catch {
        addToast("error", "Не удалось удалить расписание");
      }
    });
  };

  const insertVariable = (key: TemplateKey, variable: string) => {
    const textarea = document.getElementById(key) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{${variable}}`;

    const newText =
      textarea.value.substring(0, start) +
      variableText +
      textarea.value.substring(end);
    handleTextChange(key, newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variableText.length,
        start + variableText.length
      );
    }, 0);
  };

  const renderPreview = (config: TemplateConfig): string => {
    let text = settings[config.key];
    for (const v of config.variables) {
      text = text.split(`{${v.key}}`).join(v.preview);
    }
    return text;
  };

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>Рассылка</CustomTitle>
      </TitleField>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <ScheduleSection>
        <DefaultContainer>
          <ScheduleHeader>
            <ModalInfoTitle>Расписание рассылок</ModalInfoTitle>
            <DarkCyanButton
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={isLoading}
            >
              + Добавить рассылку
            </DarkCyanButton>
          </ScheduleHeader>

          <ScheduleHint>
            Выберите, когда отправлять сообщения клиентам: заранее, в день
            платежа или после просрочки.
          </ScheduleHint>

          {scheduleSettings.length === 0 ? (
            <EmptySchedule>
              Рассылки ещё не настроены. Нажмите «Добавить рассылку».
            </EmptySchedule>
          ) : (
            <ScheduleList>
              {scheduleSettings.map((setting) => (
                <ScheduleChip key={setting.id}>
                  <ScheduleChipText>
                    {describeSenderSetting(setting)}
                  </ScheduleChipText>
                  <DeleteButton
                    size={28}
                    tooltip="Удалить рассылку"
                    onClick={() => handleDeleteSchedule(setting.id)}
                  />
                </ScheduleChip>
              ))}
            </ScheduleList>
          )}
        </DefaultContainer>
      </ScheduleSection>

      <PageContainer>
        {templateConfigs.map((config) => (
          <MessageColumn key={config.key}>
            <DefaultContainer>
              <MessageHeader>
                <ModalInfoTitle>{config.title}</ModalInfoTitle>
                <SaveButton
                  onClick={() => handleSaveText(config)}
                  disabled={isLoading || !changedFlags[config.key]}
                >
                  {isLoading ? "..." : "Сохранить"}
                </SaveButton>
              </MessageHeader>

              <ContentWrapper>
                <SectionTitle>Шаблон сообщения</SectionTitle>
                <VariableSection>
                  <VariableButtons>
                    {config.variables.map((variable) => (
                      <VariableButton
                        key={`${config.key}-${variable.key}`}
                        onClick={() => insertVariable(config.key, variable.key)}
                        disabled={isLoading}
                        title={`Вставить {${variable.key}}`}
                      >
                        {variable.label}
                      </VariableButton>
                    ))}
                  </VariableButtons>
                </VariableSection>

                <CustomTextArea
                  id={config.key}
                  value={settings[config.key]}
                  onChange={(e) => handleTextChange(config.key, e.target.value)}
                  placeholder={config.placeholder}
                  disabled={isLoading}
                  rows={8}
                />

                <PreviewSection>
                  <SectionTitle>Предпросмотр</SectionTitle>
                  <MessagePreview>
                    <PreviewText>{renderPreview(config)}</PreviewText>
                  </MessagePreview>
                </PreviewSection>
              </ContentWrapper>
            </DefaultContainer>
          </MessageColumn>
        ))}
      </PageContainer>

      <AddSenderScheduleModal
        isOpen={isScheduleModalOpen}
        existing={scheduleSettings}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={handleAddSchedule}
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

export default SenderPage;

const ErrorBanner = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
  font-size: 14px;
`;

const SaveButton = styled(DarkCyanButton)`
  min-width: 100px;
  flex-shrink: 0;
`;

const ScheduleSection = styled.div`
  padding: 24px 16px 0;
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
  }
`;

const ScheduleHint = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
`;

const EmptySchedule = styled.div`
  font-size: 14px;
  color: #9ca3af;
  padding: 16px;
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
`;

const ScheduleList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ScheduleChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 14px;
  background-color: rgba(0, 125, 136, 0.08);
  border: 1px solid rgba(0, 125, 136, 0.25);
  border-radius: 20px;
`;

const ScheduleChipText = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #007d88;
  white-space: nowrap;
`;

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 24px;
  padding: 24px 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MessageColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  gap: 16px;
  flex-shrink: 0;

  h2 {
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
`;

const VariableSection = styled.div`
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const VariableButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const VariableButton = styled.button<{ disabled?: boolean }>`
  background-color: rgba(0, 125, 136, 1);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 12px;
  font-weight: 500;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s ease;
  white-space: nowrap;
  border: none;
  &:hover:not(:disabled) {
    background-color: rgba(0, 105, 116, 1);
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const MessagePreview = styled.div`
  flex: 1;
  min-height: 0;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewText = styled.div`
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  white-space: pre-wrap;
  flex: 1;
  overflow-y: auto;
  padding: 2px;
  font-family: "Inter", "Segoe UI", sans-serif;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;
