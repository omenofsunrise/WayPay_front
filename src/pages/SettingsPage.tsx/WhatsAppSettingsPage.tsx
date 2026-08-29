import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import Checkbox from "../../components/ui/CheckBoxes/Checkbox";
import CustomInput from "../../components/ui/fields/CustomInput";
import useWhatsApp from "../../api/hooks/useWhatsApp";
import { useEmployee } from "../../api/hooks/useEmployee";
import apiClient from "../../api/client";
import type { ChannelResponse } from "../../api/types/whatsapp";

// ─── Animations ───────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 12px 18px;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  animation: ${slideIn} 0.3s ease-out;
  min-width: 280px;
  max-width: 400px;
  background: ${(p) =>
    p.$type === "success"
      ? "#10b981"
      : p.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};
`;

const ConfirmText = styled.p`
  padding: 16px 28px;
  font-size: 15px;
  color: #374151;
  line-height: 1.55;
  margin: 0;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysRemaining = (activeTill: string | undefined): number | null => {
  if (!activeTill) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(activeTill);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

const formatExpiryDate = (dateStr: string): string => {
  if (!dateStr) return "Не указана";
  return new Date(dateStr).toLocaleDateString("ru-RU");
};

const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return "";
  const clean = phone.replace(/\+/g, "");
  if (clean.length === 11) {
    return `+${clean[0]} (${clean.slice(1, 4)}) ${clean.slice(
      4,
      7
    )}-${clean.slice(7, 9)}-${clean.slice(9, 11)}`;
  }
  return `+${clean}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const WhatsAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    getChannels,
    createChannel,
    deleteChannel,
    setCurrentChannel,
    isLoading,
    setChannelEmployees,
    extendChannel,
    getQR,
    logout,
  } = useWhatsApp();
  const { employees, fetchEmployees, employeesLoading } = useEmployee();

  const [whatsAppNumbers, setWhatsAppNumbers] = useState<ChannelResponse[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<ChannelResponse | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<string | null>(null);
  const [extendChannelId, setExtendChannelId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendChannelName, setExtendChannelName] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [qrStatus, setQrStatus] = useState<string>("");
  const [checkingChannelId, setCheckingChannelId] = useState<string | null>(
    null
  );
  const [newChannelName, setNewChannelName] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState<number[]>([]);
  const [empSearch, setEmpSearch] = useState("");

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
    loadChannels();
    fetchEmployees({ page: 1, pageSize: 100 }).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChannels = async () => {
    const result = await getChannels();
    setWhatsAppNumbers(result?.length ? result : []);
  };

  const isSubscriptionExpired = (activeTill: string | undefined): boolean => {
    const days = getDaysRemaining(activeTill);
    return days === null || days < 0;
  };

  const canPerformAction = (number: ChannelResponse): boolean => {
    if (number.stopped) {
      addToast("error", "Невозможно выполнить действие: канал остановлен");
      return false;
    }
    if (number.blocked) {
      addToast("error", "Невозможно выполнить действие: канал заблокирован");
      return false;
    }
    if (isSubscriptionExpired(number.activeTill)) {
      addToast(
        "error",
        "Невозможно выполнить действие: подписка истекла. Необходимо продлить"
      );
      return false;
    }
    return true;
  };

  const handleLogin = async (numberId: string) => {
    const number = whatsAppNumbers.find((n) => n.id === numberId);
    if (number && !canPerformAction(number)) return;
    setIsLoggingIn(numberId);
    try {
      const qrResult = await getQR(numberId);
      if (qrResult?.qrString) {
        setQrCode(qrResult.qrString);
        setQrStatus(qrResult.status);
        setSelectedNumber(number ?? null);
        setShowQRModal(true);
        pollConnectionStatus(numberId);
      } else {
        addToast("warning", "Попробуйте снова через 10 секунд");
      }
    } catch {
      addToast("error", "Ошибка при получении QR кода");
    } finally {
      setIsLoggingIn(null);
    }
  };

  const pollConnectionStatus = (channelId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getQR(channelId);
        if (status?.status === "CONNECTED") {
          setQrStatus("CONNECTED");
          clearInterval(interval);
          setTimeout(() => {
            setShowQRModal(false);
            setQrCode("");
            startPostConnectPoll(channelId);
          }, 1500);
        }
      } catch {
        /* silent */
      }
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000);
  };

  const startPostConnectPoll = (channelId: string) => {
    setCheckingChannelId(channelId);
    addToast("warning", "Проверяем подключение…");
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const result = await getChannels();
      const channel = result?.find((c) => c.id === channelId);
      if (channel?.status === "Connected") {
        setWhatsAppNumbers(result!);
        clearInterval(interval);
        setCheckingChannelId(null);
        addToast("success", "WhatsApp успешно подключён");
      } else if (attempts >= 15) {
        clearInterval(interval);
        setCheckingChannelId(null);
        await loadChannels();
        addToast(
          "warning",
          "Не удалось подтвердить подключение. Обновите страницу."
        );
      }
    }, 2000);
  };

  const handleLogout = (numberId: string, numberName: string) => {
    openConfirm(`Выйти из WhatsApp канала «${numberName}»?`, async () => {
      setIsLoggingOut(numberId);
      try {
        const success = await logout(numberId);
        if (success) {
          addToast("success", "Успешный выход из канала");
          await loadChannels();
        } else {
          addToast("error", "Ошибка при выходе из канала");
        }
      } catch {
        addToast("error", "Произошла ошибка при выходе из канала");
      } finally {
        setIsLoggingOut(null);
      }
    });
  };

  const handleDisconnectNumber = (numberId: string) => {
    const number = whatsAppNumbers.find((n) => n.id === numberId);
    const msg =
      number && isSubscriptionExpired(number.activeTill)
        ? "У этого канала истекла подписка. Удалить канал?"
        : "Вы уверены, что хотите удалить этот канал?";
    openConfirm(msg, async () => {
      try {
        await deleteChannel(numberId);
        addToast("success", "Канал успешно удалён");
        await loadChannels();
      } catch {
        addToast("error", "Ошибка при удалении канала");
      }
    });
  };

  const handleExtendSubscription = (channelId: string, channelName: string) => {
    setExtendChannelId(channelId);
    setExtendChannelName(channelName);
    setPaymentUrl(null);
    setExtendDays(30);
    setShowExtendModal(true);
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendChannelId) return;
    setIsExtending(true);
    try {
      const response = await apiClient.get<number>("/WhatsApp/days");
      const availableDays = response.data;
      if (extendDays > availableDays) {
        addToast(
          "warning",
          "К сожалению, дни распроданы. Обратитесь в поддержку."
        );
        return;
      }
      const url = await extendChannel(extendDays, extendChannelId);
      if (url) {
        setPaymentUrl(url);
      } else {
        addToast(
          "error",
          "Ошибка при создании платёжной ссылки. Попробуйте позже."
        );
      }
    } catch {
      addToast("error", "Произошла ошибка при создании платёжной ссылки");
    } finally {
      setIsExtending(false);
    }
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
      setShowExtendModal(false);
      setExtendChannelId(null);
      setExtendDays(30);
      setExtendChannelName("");
      setPaymentUrl(null);
      setTimeout(() => loadChannels(), 3000);
    }
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      addToast("warning", "Введите название канала");
      return;
    }
    if (newAssignedTo.length === 0) {
      addToast("warning", "Выберите хотя бы одного сотрудника");
      return;
    }
    setIsCreating(true);
    try {
      const created = await createChannel(newChannelName, newAssignedTo);
      if (created) {
        addToast("success", `Канал «${created.name}» успешно создан`);
        await loadChannels();
        setNewChannelName("");
        setNewAssignedTo([]);
        setEmpSearch("");
        setShowAddModal(false);
      } else {
        addToast("error", "Ошибка при создании канала. Попробуйте позже.");
      }
    } catch {
      addToast("error", "Произошла ошибка при создании канала");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignEmployees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNumber || !canPerformAction(selectedNumber)) return;
    setIsAssigning(true);
    try {
      const success = await setChannelEmployees(
        selectedNumber.id,
        selectedNumber.employeeIds
      );
      if (success) {
        addToast("success", "Сотрудники успешно назначены");
        await loadChannels();
        setShowAssignModal(false);
        setSelectedNumber(null);
      } else {
        addToast("error", "Ошибка при назначении сотрудников");
      }
    } catch {
      addToast("error", "Произошла ошибка при назначении сотрудников");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSetMainNumber = async (numberId: string) => {
    const number = whatsAppNumbers.find((n) => n.id === numberId);
    if (number && !canPerformAction(number)) return;
    try {
      const success = await setCurrentChannel(numberId);
      if (success) {
        addToast("success", "Основной канал успешно изменён");
        await loadChannels();
      } else {
        addToast("error", "Ошибка при изменении основного канала");
      }
    } catch {
      addToast("error", "Произошла ошибка");
    }
  };

  const employeeList = employees?.items || [];

  const getEmployeeNames = (ids: number[]) =>
    ids
      .map((id) => employeeList.find((e) => e.id === id)?.fullName || "")
      .filter(Boolean);

  const isChannelActive = (c: ChannelResponse) =>
    !isSubscriptionExpired(c.activeTill) && !c.stopped && !c.blocked;

  const filteredEmployees = empSearch.trim()
    ? employeeList.filter((e) =>
        e.fullName.toLowerCase().includes(empSearch.toLowerCase())
      )
    : employeeList;

  const connectedCount = whatsAppNumbers.filter(
    (n) => n.status === "Connected"
  ).length;
  const activeCount = whatsAppNumbers.filter((n) => isChannelActive(n)).length;

  if (isLoading && whatsAppNumbers.length === 0) {
    return (
      <PageLayout>
        <LoadingWrapper>
          <Spinner />
          <LoadingText>Загрузка каналов…</LoadingText>
        </LoadingWrapper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <CustomTitle style={{ marginTop: 0 }}>
          Настройка WhatsApp номеров
        </CustomTitle>
        <HeaderRight>
          {whatsAppNumbers.length > 0 && (
            <StatsRow>
              <StatChip $color="#10b981">{connectedCount} подключено</StatChip>
              <StatChip $color="#007d88">{activeCount} активных</StatChip>
            </StatsRow>
          )}
          <GrayButton onClick={() => navigate("/whatsapp/senders")}>
            Рассылки
          </GrayButton>
          <DarkCyanButton onClick={() => setShowAddModal(true)}>
            + Добавить канал
          </DarkCyanButton>
        </HeaderRight>
      </TitleField>

      {whatsAppNumbers.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📱</EmptyIcon>
          <EmptyTitle>Нет WhatsApp каналов</EmptyTitle>
          <EmptyDescription>
            Подключите первый номер, чтобы начать работу с WhatsApp
          </EmptyDescription>
          <DarkCyanButton onClick={() => setShowAddModal(true)}>
            + Добавить WhatsApp канал
          </DarkCyanButton>
        </EmptyState>
      ) : (
        <NumbersList>
          {whatsAppNumbers.map((number) => {
            const employeeNames = getEmployeeNames(number.employeeIds);
            const expired = isSubscriptionExpired(number.activeTill);
            const active = isChannelActive(number);
            const daysLeft = getDaysRemaining(number.activeTill);
            const isConnected = number.status === "Connected";
            const isBusy =
              isLoggingIn === number.id || isLoggingOut === number.id;

            const cardStatus: "connected" | "expired" | "inactive" | "normal" =
              number.stopped || number.blocked
                ? "inactive"
                : expired
                ? "expired"
                : isConnected
                ? "connected"
                : "normal";

            return (
              <NumberCard key={number.id} $status={cardStatus}>
                {/* ── Header ── */}
                <CardHeader>
                  <CardHeaderLeft>
                    <StatusDot $connected={isConnected} />
                    <ChannelName>
                      {number.name}
                      {number.isCurrent && (
                        <PrimaryBadge>Основной</PrimaryBadge>
                      )}
                    </ChannelName>
                  </CardHeaderLeft>
                  <CardHeaderRight>
                    {number.phone && (
                      <PhoneChip>{formatPhoneNumber(number.phone)}</PhoneChip>
                    )}
                  </CardHeaderRight>
                </CardHeader>

                {/* ── Status badges ── */}
                <BadgeRow>
                  {checkingChannelId === number.id && (
                    <StatusBadge $variant="neutral">
                      <InlineSpin /> Проверяем подключение…
                    </StatusBadge>
                  )}
                  {isConnected && active && (
                    <StatusBadge $variant="success">Подключён</StatusBadge>
                  )}
                  {!isConnected && active && (
                    <StatusBadge $variant="neutral">Не подключён</StatusBadge>
                  )}
                  {number.stopped && (
                    <StatusBadge $variant="danger">Остановлен</StatusBadge>
                  )}
                  {number.blocked && (
                    <StatusBadge $variant="danger">Заблокирован</StatusBadge>
                  )}
                  {expired && !number.stopped && !number.blocked && (
                    <StatusBadge $variant="warning">
                      Подписка истекла
                    </StatusBadge>
                  )}
                  {!expired && daysLeft !== null && daysLeft <= 14 && (
                    <StatusBadge $variant="warning">
                      Осталось {daysLeft} дн.
                    </StatusBadge>
                  )}
                </BadgeRow>

                {/* ── Info ── */}
                <CardMeta>
                  <MetaRow>
                    <MetaLabel>Сотрудники</MetaLabel>
                    <MetaValue>
                      {employeeNames.length > 0 ? (
                        <EmployeeChips>
                          {employeeNames.map((name) => (
                            <EmployeeChip key={name}>{name}</EmployeeChip>
                          ))}
                        </EmployeeChips>
                      ) : (
                        <MutedText>Не назначены</MutedText>
                      )}
                    </MetaValue>
                  </MetaRow>

                  {number.activeTill && (
                    <MetaRow>
                      <MetaLabel>Подписка до</MetaLabel>
                      <MetaValue>
                        <SubscriptionDate $expired={expired}>
                          {formatExpiryDate(number.activeTill)}
                        </SubscriptionDate>
                        {daysLeft !== null && !expired && (
                          <DaysLeftBadge $days={daysLeft}>
                            {daysLeft > 30
                              ? `${daysLeft} дней`
                              : daysLeft > 0
                              ? `${daysLeft} дн.`
                              : "истекает сегодня"}
                          </DaysLeftBadge>
                        )}
                      </MetaValue>
                    </MetaRow>
                  )}
                </CardMeta>

                {/* ── Actions ── */}
                <CardActions>
                  <ActionsLeft>
                    {!number.stopped &&
                      !number.blocked &&
                      !isConnected &&
                      !expired && (
                        <DarkCyanButton
                          onClick={() => handleLogin(number.id)}
                          disabled={isBusy}
                        >
                          {isLoggingIn === number.id
                            ? "Получение QR…"
                            : "Подключить"}
                        </DarkCyanButton>
                      )}
                    {isConnected && (
                      <GrayButton
                        onClick={() => handleLogout(number.id, number.name)}
                        disabled={isBusy}
                      >
                        {isLoggingOut === number.id ? "Выход…" : "Выйти"}
                      </GrayButton>
                    )}
                    {!number.stopped && !number.blocked && (
                      <GrayButton
                        onClick={() => {
                          setSelectedNumber({ ...number });
                          setEmpSearch("");
                          setShowAssignModal(true);
                        }}
                      >
                        Назначить
                      </GrayButton>
                    )}
                    {isConnected && !number.isCurrent && (
                      <GrayButton
                        onClick={() => handleSetMainNumber(number.id)}
                      >
                        Сделать основным
                      </GrayButton>
                    )}
                    {isConnected && (
                      <GrayButton
                        onClick={() =>
                          navigate(`/whatsapp/channel/${number.id}/bots`)
                        }
                      >
                        Настроить бота
                      </GrayButton>
                    )}
                  </ActionsLeft>

                  <ActionsRight>
                    <DarkCyanButton
                      onClick={() =>
                        handleExtendSubscription(number.id, number.name)
                      }
                    >
                      Продлить
                    </DarkCyanButton>
                    <DeleteBtn
                      onClick={() => handleDisconnectNumber(number.id)}
                    >
                      Удалить
                    </DeleteBtn>
                  </ActionsRight>
                </CardActions>
              </NumberCard>
            );
          })}
        </NumbersList>
      )}

      {/* ── QR Modal ── */}
      {showQRModal && selectedNumber && qrCode && (
        <BaseModal
          title={`Подключение — ${selectedNumber.name}`}
          onClose={() => {
            setShowQRModal(false);
            setQrCode("");
            if (selectedNumber) startPostConnectPoll(selectedNumber.id);
          }}
          onCancel={() => {
            setShowQRModal(false);
            setQrCode("");
            if (selectedNumber) startPostConnectPoll(selectedNumber.id);
          }}
          mode="view"
          hideCanselButton={true}
          width="520px"
        >
          <QRContainer>
            <QRCodeImage src={qrCode} alt="WhatsApp QR Code" />
            {[
              "Откройте WhatsApp на телефоне",
              "Нажмите Меню → Связанные устройства",
              "Нажмите «Связать устройство» и отсканируйте QR код",
              "После успешного подключения перезагрузите страницу",
            ].map((text, i) => (
              <QRStep key={i}>
                <StepNumber>{i + 1}</StepNumber>
                <StepText>{text}</StepText>
              </QRStep>
            ))}
            {qrStatus === "CONNECTED" && (
              <SuccessBox>✓ Успешно подключено!</SuccessBox>
            )}
            {qrStatus !== "CONNECTED" && (
              <DarkCyanButton
                onClick={() => {
                  setShowQRModal(false);
                  setQrCode("");
                  if (selectedNumber) startPostConnectPoll(selectedNumber.id);
                }}
                style={{ marginTop: 8 }}
              >
                Я подключил
              </DarkCyanButton>
            )}
          </QRContainer>
        </BaseModal>
      )}

      {/* ── Add Channel Modal ── */}
      {showAddModal && (
        <BaseModal
          title="Добавить WhatsApp канал"
          onClose={() =>
            !isCreating &&
            (setShowAddModal(false),
            setNewChannelName(""),
            setNewAssignedTo([]),
            setEmpSearch(""))
          }
          onCancel={() =>
            !isCreating &&
            (setShowAddModal(false),
            setNewChannelName(""),
            setNewAssignedTo([]),
            setEmpSearch(""))
          }
          onSave={handleAddNumber}
          isSubmitting={isCreating}
          isSaveDisabled={
            isCreating || newAssignedTo.length === 0 || !newChannelName.trim()
          }
          saveButtonText={isCreating ? "Создание…" : "Создать канал"}
          width="560px"
        >
          <ModalBody>
            <ModalField>
              <ModalLabel>
                Название канала <Required>*</Required>
              </ModalLabel>
              <CustomInput
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Например: Главный офис"
                disabled={isCreating}
                autoFocus
              />
            </ModalField>

            <ModalField>
              <ModalLabelRow>
                <ModalLabel>
                  Доступ сотрудникам <Required>*</Required>
                </ModalLabel>
                {newAssignedTo.length > 0 && (
                  <SelectedCount>{newAssignedTo.length} выбрано</SelectedCount>
                )}
              </ModalLabelRow>
              {employeesLoading ? (
                <MutedText>Загрузка сотрудников…</MutedText>
              ) : (
                <>
                  <SearchInput
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Поиск сотрудника…"
                  />
                  <EmployeesGrid>
                    {filteredEmployees.map((emp) => (
                      <EmployeeRow
                        key={emp.id}
                        $active={newAssignedTo.includes(emp.id)}
                        onClick={() =>
                          setNewAssignedTo((prev) =>
                            prev.includes(emp.id)
                              ? prev.filter((id) => id !== emp.id)
                              : [...prev, emp.id]
                          )
                        }
                      >
                        <Checkbox
                          checked={newAssignedTo.includes(emp.id)}
                          onChange={() => {}}
                        />
                        <EmpInfo>
                          <EmpName>{emp.fullName}</EmpName>
                          <EmpRole>{emp.role}</EmpRole>
                        </EmpInfo>
                      </EmployeeRow>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <MutedText>Ничего не найдено</MutedText>
                    )}
                  </EmployeesGrid>
                </>
              )}
            </ModalField>
          </ModalBody>
        </BaseModal>
      )}

      {/* ── Assign Employees Modal ── */}
      {showAssignModal && selectedNumber && (
        <BaseModal
          title={`Сотрудники — «${selectedNumber.name}»`}
          onClose={() => !isAssigning && setShowAssignModal(false)}
          onCancel={() => !isAssigning && setShowAssignModal(false)}
          onSave={handleAssignEmployees}
          isSubmitting={isAssigning}
          saveButtonText={isAssigning ? "Сохранение…" : "Сохранить"}
          width="560px"
        >
          <ModalBody>
            <ModalField>
              <ModalLabelRow>
                <ModalLabel>Доступ сотрудникам</ModalLabel>
                {selectedNumber.employeeIds.length > 0 && (
                  <SelectedCount>
                    {selectedNumber.employeeIds.length} выбрано
                  </SelectedCount>
                )}
              </ModalLabelRow>
              {employeesLoading ? (
                <MutedText>Загрузка сотрудников…</MutedText>
              ) : (
                <>
                  <SearchInput
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Поиск сотрудника…"
                  />
                  <EmployeesGrid>
                    {(empSearch.trim()
                      ? employeeList.filter((e) =>
                          e.fullName
                            .toLowerCase()
                            .includes(empSearch.toLowerCase())
                        )
                      : employeeList
                    ).map((emp) => (
                      <EmployeeRow
                        key={emp.id}
                        $active={selectedNumber.employeeIds.includes(emp.id)}
                        onClick={() =>
                          setSelectedNumber({
                            ...selectedNumber,
                            employeeIds: selectedNumber.employeeIds.includes(
                              emp.id
                            )
                              ? selectedNumber.employeeIds.filter(
                                  (id) => id !== emp.id
                                )
                              : [...selectedNumber.employeeIds, emp.id],
                          })
                        }
                      >
                        <Checkbox
                          checked={selectedNumber.employeeIds.includes(emp.id)}
                          onChange={() => {}}
                        />
                        <EmpInfo>
                          <EmpName>{emp.fullName}</EmpName>
                          <EmpRole>{emp.role}</EmpRole>
                        </EmpInfo>
                      </EmployeeRow>
                    ))}
                  </EmployeesGrid>
                </>
              )}
            </ModalField>
          </ModalBody>
        </BaseModal>
      )}

      {/* ── Extend Subscription Modal ── */}
      {showExtendModal && extendChannelId && (
        <BaseModal
          title={`Продление подписки${
            extendChannelName ? ` — «${extendChannelName}»` : ""
          }`}
          onClose={() => !isExtending && setShowExtendModal(false)}
          onCancel={() => !isExtending && setShowExtendModal(false)}
          onSave={paymentUrl ? handleGoToPayment : handleCreatePaymentLink}
          isSubmitting={isExtending}
          saveButtonText={
            paymentUrl
              ? "Перейти к оплате →"
              : isExtending
              ? "Создание платежа…"
              : "Создать платёж"
          }
          width="480px"
        >
          <ModalBody>
            {!paymentUrl ? (
              <ModalField>
                <ModalLabel>Выберите срок продления</ModalLabel>
                <DaysGrid>
                  {[
                    { days: 30, label: "1 месяц", price: "1 000 ₽" },
                    { days: 90, label: "3 месяца", price: "3 000 ₽" },
                    { days: 365, label: "1 год", price: "12 000 ₽" },
                  ].map((opt) => (
                    <DayOption
                      key={opt.days}
                      $selected={extendDays === opt.days}
                      $disabled={isExtending}
                      onClick={() => !isExtending && setExtendDays(opt.days)}
                    >
                      <DaysLabel>{opt.label}</DaysLabel>
                      <DaysDays>{opt.days} дней</DaysDays>
                      <DaysPrice>{opt.price}</DaysPrice>
                    </DayOption>
                  ))}
                </DaysGrid>
              </ModalField>
            ) : (
              <>
                <ModalField>
                  <ModalLabel>Ссылка для оплаты</ModalLabel>
                  <PaymentLink>{paymentUrl}</PaymentLink>
                </ModalField>
                <InfoBox>
                  После оплаты подписка будет активирована автоматически.
                  Страница обновится через несколько секунд.
                </InfoBox>
              </>
            )}
          </ModalBody>
        </BaseModal>
      )}

      {/* ── Confirm Modal ── */}
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
};

// ─── Styled components ─────────────────────────────────────────────────────────

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 14px;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: rgba(0, 125, 136, 1);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const InlineSpin = styled.div`
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(55, 65, 81, 0.3);
  border-top-color: #374151;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  margin-right: 4px;
  vertical-align: middle;
`;

const LoadingText = styled.div`
  color: #9ca3af;
  font-size: 14px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
`;

const StatChip = styled.span<{ $color: string }>`
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$color}33;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const NumbersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
`;

const cardBorderColor: Record<string, string> = {
  connected: "#10b981",
  normal: "#007d88",
  expired: "#f59e0b",
  inactive: "#d1d5db",
};

const NumberCard = styled.div<{
  $status: "connected" | "expired" | "inactive" | "normal";
}>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border-left: 4px solid ${(p) => cardBorderColor[p.$status] || "#007d88"};
  opacity: ${(p) =>
    p.$status === "inactive" || p.$status === "expired" ? 0.82 : 1};
  transition: box-shadow 0.2s ease, transform 0.15s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.11);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;

const CardHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const CardHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const pulseAnim = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
  50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
`;

const StatusDot = styled.div<{ $connected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => (p.$connected ? "#10b981" : "#d1d5db")};
  animation: ${(p) => (p.$connected ? pulseAnim : "none")} 2.5s ease infinite;
`;

const ChannelName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
`;

const PrimaryBadge = styled.span`
  background: rgba(0, 125, 136, 0.12);
  color: rgba(0, 125, 136, 1);
  border: 1px solid rgba(0, 125, 136, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`;

const PhoneChip = styled.div`
  font-size: 13px;
  color: #374151;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const statusBadgeColors: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  success: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  warning: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  danger: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  neutral: { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
};

const StatusBadge = styled.span<{
  $variant: "success" | "warning" | "danger" | "neutral";
}>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${(p) => statusBadgeColors[p.$variant].bg};
  color: ${(p) => statusBadgeColors[p.$variant].color};
  border: 1px solid ${(p) => statusBadgeColors[p.$variant].border};
`;

const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 14px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const MetaLabel = styled.span`
  font-size: 13px;
  color: #9ca3af;
  min-width: 110px;
  padding-top: 2px;
`;

const MetaValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`;

const EmployeeChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const EmployeeChip = styled.span`
  background: #f3f4f6;
  color: #374151;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
`;

const SubscriptionDate = styled.span<{ $expired: boolean }>`
  font-size: 13px;
  color: ${(p) => (p.$expired ? "#ef4444" : "#374151")};
  font-weight: ${(p) => (p.$expired ? "600" : "normal")};
`;

const DaysLeftBadge = styled.span<{ $days: number }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  background: ${(p) =>
    p.$days > 30 ? "#d1fae5" : p.$days > 7 ? "#fef3c7" : "#fee2e2"};
  color: ${(p) =>
    p.$days > 30 ? "#065f46" : p.$days > 7 ? "#92400e" : "#991b1b"};
`;

const MutedText = styled.span`
  color: #9ca3af;
  font-size: 13px;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionsLeft = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionsRight = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const DeleteBtn = styled.button`
  padding: 8px 16px;
  border: 1px solid #fca5a5;
  background: white;
  color: #ef4444;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background: #fee2e2;
    border-color: #ef4444;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 72px 20px;
  background: white;
  border-radius: 14px;
  margin-top: 8px;
  gap: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  line-height: 1;
  margin-bottom: 4px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

const EmptyDescription = styled.p`
  color: #9ca3af;
  font-size: 14px;
  margin: 0 0 8px;
  max-width: 320px;
  line-height: 1.5;
`;

// ─── Modal internals ──────────────────────────────────────────────────────────

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 24px 12px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ModalLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const SelectedCount = styled.span`
  font-size: 12px;
  color: rgba(0, 125, 136, 1);
  font-weight: 600;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: rgba(0, 125, 136, 1);
  }
  &::placeholder {
    color: #9ca3af;
  }
`;

const EmployeesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 2px;
`;

const EmployeeRow = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid ${(p) => (p.$active ? "rgba(0,125,136,1)" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${(p) => (p.$active ? "rgba(0,125,136,0.04)" : "white")};
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const EmpInfo = styled.div`
  flex: 1;
`;
const EmpName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;
const EmpRole = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 1px;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const DayOption = styled.div<{ $selected: boolean; $disabled: boolean }>`
  padding: 16px 12px;
  border: 2px solid ${(p) => (p.$selected ? "rgba(0,125,136,1)" : "#e5e7eb")};
  border-radius: 10px;
  text-align: center;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  background: ${(p) => (p.$selected ? "rgba(0,125,136,0.05)" : "white")};
  transition: all 0.15s;

  &:hover {
    border-color: ${(p) => (p.$disabled ? "#e5e7eb" : "rgba(0,125,136,1)")};
  }
`;

const DaysLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
`;
const DaysDays = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
`;
const DaysPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 125, 136, 1);
`;

const PaymentLink = styled.div`
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
  color: #374151;
  font-family: monospace;
  word-break: break-all;
  line-height: 1.4;
`;

const InfoBox = styled.div`
  padding: 12px 14px;
  background: #f0f9fa;
  border: 1px solid rgba(0, 125, 136, 0.25);
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
`;

// ─── QR Modal ─────────────────────────────────────────────────────────────────

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 24px 16px;
  gap: 10px;
`;

const QRCodeImage = styled.img`
  width: 220px;
  height: 220px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 8px;
`;

const QRStep = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
`;

const StepNumber = styled.div`
  width: 26px;
  height: 26px;
  background: rgba(0, 125, 136, 1);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
`;

const StepText = styled.div`
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
`;

const SuccessBox = styled.div`
  width: 100%;
  padding: 12px;
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  color: #065f46;
  font-weight: 600;
  text-align: center;
  font-size: 14px;
`;

export default WhatsAppSettingsPage;
