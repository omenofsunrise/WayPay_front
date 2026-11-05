import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import BackButtonComponent from "../../components/ui/Buttons/BackButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import useWhatsApp from "../../api/hooks/useWhatsApp";
import type {
  BotResponse,
  BotType,
  BotEventType,
} from "../../api/types/whatsapp";
import { BotResponseTextType } from "../../api/types/whatsapp";
import BotResponseConstructor from "./BotResponseConstructor";
import { validateBotTemplate } from "./botTemplateVariables";

const BOT_TYPE_LABEL: Record<BotType, string> = {
  Keywords: "По ключевым словам",
  Events: "По событию",
};

const isOverdueEvent = (rule: BotResponse) =>
  rule.event === "ComingPayment" &&
  ((rule.eventDays != null && rule.eventDays < 0) ||
    (rule.eventHours != null && rule.eventHours < 0));

const getEventLabel = (rule: BotResponse) => {
  if (!rule.event) return "";
  return isOverdueEvent(rule) ? EVENT_LABEL.OverduePayment : EVENT_LABEL[rule.event];
};

const getEventSchedule = (rule: BotResponse) => {
  if (rule.event !== "ComingPayment") return "";
  const days = rule.eventDays != null ? Math.abs(rule.eventDays) : 0;
  const hours = rule.eventHours != null ? Math.abs(rule.eventHours) : 0;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} дн.`);
  if (hours > 0) parts.push(`${hours} ч.`);
  if (parts.length === 0) return "";
  const prefix = isOverdueEvent(rule) ? "через" : "за";
  const suffix = isOverdueEvent(rule) ? "после" : "до";
  return ` · ${prefix} ${parts.join(" ")} ${suffix} платежа`;
};

const EVENT_LABEL: Record<BotEventType, string> = {
  CreatedCredit: "Создание рассрочки",
  CreatedPayment: "Создание платежа",
  ClientBirthdate: "День рождения клиента",
  ComingPayment: "На приближающийся платёж",
  OverduePayment: "На просроченный платёж",
};

const EVENT_OPTIONS: BotEventType[] = [
  "CreatedCredit",
  "CreatedPayment",
  "ClientBirthdate",
];

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
  white-space: pre-line;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const BotManagementPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  const {
    loadBotsByChannel,
    createBot,
    updateBot,
    deleteBot,
    addBotKeyword,
    deleteBotKeyword,
    setBotResponse,
    setBotEvent,
    bots,
    isLoading,
  } = useWhatsApp();

  const [localBots, setLocalBots] = useState<BotResponse[]>([]);

  const [ruleModal, setRuleModal] = useState<{
    isOpen: boolean;
    editingRule: BotResponse | null;
    name: string;
    isActive: boolean;
    botType: BotType;
    saving: boolean;
  }>({
    isOpen: false,
    editingRule: null,
    name: "",
    isActive: true,
    botType: "Keywords",
    saving: false,
  });

  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    response: string;
    kind: "main" | "noClient";
    saving: boolean;
  }>({
    isOpen: false,
    rule: null,
    response: "",
    kind: "main",
    saving: false,
  });

  const [keywordModal, setKeywordModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    keyword: string;
    matchType: "Exact" | "Contains" | "StartsWith";
    adding: boolean;
  }>({
    isOpen: false,
    rule: null,
    keyword: "",
    matchType: "Contains",
    adding: false,
  });

  const [eventModal, setEventModal] = useState<{
    isOpen: boolean;
    rule: BotResponse | null;
    eventType: BotEventType;
    eventDays: string;
    eventHours: string;
    saving: boolean;
  }>({
    isOpen: false,
    rule: null,
    eventType: "CreatedCredit",
    eventDays: "",
    eventHours: "",
    saving: false,
  });

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
    if (channelId) {
      loadRules();
    }
  }, [channelId]);

  useEffect(() => {
    setLocalBots(bots);
  }, [bots]);

  const loadRules = async () => {
    if (channelId) {
      await loadBotsByChannel(channelId);
    }
  };

  // === Управление правилами ===

  const handleCreateRule = () => {
    setRuleModal({
      isOpen: true,
      editingRule: null,
      name: "",
      isActive: true,
      botType: "Keywords",
      saving: false,
    });
  };

  const handleEditRule = (rule: BotResponse) => {
    setRuleModal({
      isOpen: true,
      editingRule: rule,
      name: rule.name,
      isActive: rule.isActive,
      botType: rule.botType,
      saving: false,
    });
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleModal.name.trim()) {
      addToast("warning", "Введите название правила");
      return;
    }

    setRuleModal((prev) => ({ ...prev, saving: true }));

    try {
      if (ruleModal.editingRule) {
        await updateBot(
          ruleModal.name,
          ruleModal.editingRule.id,
          ruleModal.isActive
        );
        addToast("success", "Название правила обновлено");
      } else {
        if (!channelId) return;
        const newBot = await createBot(
          channelId,
          ruleModal.name,
          ruleModal.botType
        );
        if (newBot && ruleModal.isActive !== undefined) {
          await updateBot(newBot.name, newBot.id, ruleModal.isActive);
        }
        addToast("success", "Правило создано");
      }
      await loadRules();
      setRuleModal((prev) => ({ ...prev, isOpen: false }));
    } catch {
      addToast("error", "Ошибка при сохранении");
    } finally {
      setRuleModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleToggleRule = async (rule: BotResponse) => {
    try {
      await updateBot(rule.name, rule.id, !rule.isActive);
      await loadRules();
    } catch {
      addToast("error", "Ошибка при изменении статуса");
    }
  };

  const handleDeleteRule = (rule: BotResponse) => {
    openConfirm(`Удалить правило "${rule.name}"?`, async () => {
      try {
        await deleteBot(rule.id);
        await loadRules();
        addToast("success", "Правило удалено");
      } catch {
        addToast("error", "Ошибка при удалении");
      }
    });
  };

  // === Управление ответами ===

  const handleEditResponse = (rule: BotResponse) => {
    setResponseModal({
      isOpen: true,
      rule,
      response: rule.botResponse || "",
      kind: "main",
      saving: false,
    });
  };

  const handleEditNoClientResponse = (rule: BotResponse) => {
    setResponseModal({
      isOpen: true,
      rule,
      response: rule.botNoClientResponse || "",
      kind: "noClient",
      saving: false,
    });
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseModal.response.trim()) {
      addToast("warning", "Введите ответ бота");
      return;
    }
    if (!responseModal.rule) return;

    const issues = validateBotTemplate(responseModal.response);
    if (issues.length > 0) {
      openConfirm(
        `Найдены проблемы в шаблоне:\n\n${issues
          .map((i) => "• " + i.message)
          .join("\n")}\n\nСохранить всё равно?`,
        async () => {
          await doSaveResponse();
        }
      );
      return;
    }

    await doSaveResponse();
  };

  const doSaveResponse = async () => {
    if (!responseModal.rule) return;
    setResponseModal((prev) => ({ ...prev, saving: true }));
    try {
      const type =
        responseModal.kind === "noClient"
          ? BotResponseTextType.WhatsAppBotNoClientResponse
          : undefined;
      await setBotResponse(responseModal.rule.id, responseModal.response, type);
      await loadRules();
      addToast("success", "Ответ обновлён");
      setResponseModal((prev) => ({ ...prev, isOpen: false }));
    } catch {
      addToast("error", "Ошибка при сохранении ответа");
    } finally {
      setResponseModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // === Управление ключевыми словами ===

  const handleOpenKeywords = (rule: BotResponse) => {
    setKeywordModal({
      isOpen: true,
      rule,
      keyword: "",
      matchType: "Contains",
      adding: false,
    });
  };

  const handleAddKeyword = async () => {
    if (!keywordModal.keyword.trim()) {
      addToast("warning", "Введите ключевое слово");
      return;
    }
    if (!keywordModal.rule) return;

    setKeywordModal((prev) => ({ ...prev, adding: true }));
    try {
      await addBotKeyword(
        keywordModal.rule.id,
        keywordModal.matchType,
        keywordModal.keyword.trim()
      );
      await loadRules();
      setKeywordModal((prev) => ({ ...prev, keyword: "" }));
      addToast("success", "Ключевое слово добавлено");
    } catch {
      addToast("error", "Ошибка при добавлении");
    } finally {
      setKeywordModal((prev) => ({ ...prev, adding: false }));
    }
  };

  const handleDeleteKeyword = (keywordId: number, ruleId: number) => {
    openConfirm("Удалить ключевое слово?", async () => {
      try {
        await deleteBotKeyword(keywordId, ruleId);
        await loadRules();
      } catch {
        addToast("error", "Ошибка при удалении");
      }
    });
  };

  const handleOpenEvent = (rule: BotResponse) => {
    const overdue = isOverdueEvent(rule);
    setEventModal({
      isOpen: true,
      rule,
      eventType: overdue ? "OverduePayment" : rule.event ?? "CreatedCredit",
      eventDays:
        rule.eventDays != null ? String(Math.abs(rule.eventDays)) : "",
      eventHours:
        rule.eventHours != null ? String(Math.abs(rule.eventHours)) : "",
      saving: false,
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventModal.rule) return;

    const isTimed =
      eventModal.eventType === "ComingPayment" ||
      eventModal.eventType === "OverduePayment";

    let eventDays: number | null = null;
    let eventHours: number | null = null;

    if (isTimed) {
      const daysRaw = eventModal.eventDays.trim();
      const hoursRaw = eventModal.eventHours.trim();

      let parsedDays = 0;
      let parsedHours = 0;

      if (daysRaw) {
        const n = Number(daysRaw);
        if (!Number.isInteger(n) || n < 0) {
          addToast("warning", "Дни должны быть целым неотрицательным числом");
          return;
        }
        parsedDays = n;
      }

      if (hoursRaw) {
        const n = Number(hoursRaw);
        if (!Number.isInteger(n) || n < 0 || n > 23) {
          addToast("warning", "Часы должны быть целым числом от 0 до 23");
          return;
        }
        parsedHours = n;
      }

      if (parsedDays === 0 && parsedHours === 0) {
        addToast("warning", "Укажите хотя бы дни или часы");
        return;
      }

      // Для "просрочки" уходит ComingPayment с отрицательными значениями
      const sign = eventModal.eventType === "OverduePayment" ? -1 : 1;
      eventDays = parsedDays ? sign * parsedDays : null;
      eventHours = parsedHours ? sign * parsedHours : null;
    }

    // На бэк всегда уходит ComingPayment (даже для "просрочки")
    const eventTypeToSend: BotEventType =
      eventModal.eventType === "OverduePayment"
        ? "ComingPayment"
        : eventModal.eventType;

    setEventModal((prev) => ({ ...prev, saving: true }));
    try {
      await setBotEvent(
        eventModal.rule.id,
        eventTypeToSend,
        eventDays,
        eventHours,
      );
      await loadRules();
      addToast("success", "Событие установлено");
      setEventModal((prev) => ({ ...prev, isOpen: false }));
    } catch {
      addToast("error", "Ошибка при установке события");
    } finally {
      setEventModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const getMatchTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      Exact: "Точно совпадает",
      Contains: "Содержит",
      StartsWith: "Начинается с",
    };
    return types[type] || type;
  };

  const getMatchTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Exact: "#1890ff",
      Contains: "#52c41a",
      StartsWith: "#faad14",
    };
    return colors[type] || "#666";
  };

  const keywordRule = keywordModal.rule
    ? localBots.find((b) => b.id === keywordModal.rule!.id) ?? keywordModal.rule
    : null;

  if (isLoading && localBots.length === 0) {
    return (
      <PageLayout>
        <LoadingText>Загрузка...</LoadingText>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <BackButtonComponent
          style={{ margin: 0, marginRight: 12 }}
          onClick={() => navigate(-1)}
        >
          Назад
        </BackButtonComponent>
        <CustomTitle style={{ margin: 0, flex: 1 }}>Правила бота</CustomTitle>
        <DarkCyanButton onClick={handleCreateRule}>
          + Новое правило
        </DarkCyanButton>
      </TitleField>

      {localBots.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Нет правил</EmptyTitle>
          <EmptyText>
            Создайте первое правило для автоматических ответов
          </EmptyText>
        </EmptyState>
      ) : (
        <RulesGrid>
          {localBots.map((rule) => {
            const isEventsBot = rule.botType === "Events";
            return (
              <RuleCard key={rule.id} $isActive={rule.isActive}>
                <CardHeader>
                  <CardTitleRow>
                    <RuleName>{rule.name || "Без названия"}</RuleName>
                    <TypeBadge $kind={rule.botType}>
                      {BOT_TYPE_LABEL[rule.botType]}
                    </TypeBadge>
                    <StatusBadge $isActive={rule.isActive}>
                      {rule.isActive ? "Активно" : "Отключено"}
                    </StatusBadge>
                  </CardTitleRow>
                  <CardActions>
                    <ActionButton
                      onClick={() => handleToggleRule(rule)}
                      title={rule.isActive ? "Отключить" : "Активировать"}
                    >
                      {rule.isActive ? "Откл." : "Вкл."}
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleEditRule(rule)}
                      title="Редактировать название"
                    >
                      Изменить
                    </ActionButton>
                    {!isEventsBot && (
                      <ActionButton
                        onClick={() => handleOpenKeywords(rule)}
                        title="Ключевые слова"
                      >
                        Ключ. слова
                      </ActionButton>
                    )}
                    {isEventsBot && (
                      <ActionButton
                        onClick={() => handleOpenEvent(rule)}
                        title="Событие"
                      >
                        Событие
                      </ActionButton>
                    )}
                    <ActionButtonDelete
                      onClick={() => handleDeleteRule(rule)}
                      title="Удалить"
                    >
                      Удалить
                    </ActionButtonDelete>
                  </CardActions>
                </CardHeader>

                <ResponseBlock onClick={() => handleEditResponse(rule)}>
                  <ResponseLabel>
                    Ответ бота:
                    <EditHint>нажмите для редактирования</EditHint>
                  </ResponseLabel>
                  <ResponseText>
                    {rule.botResponse || "— Нажмите чтобы добавить ответ —"}
                  </ResponseText>
                </ResponseBlock>

                {!isEventsBot && (
                  <ResponseBlock
                    onClick={() => handleEditNoClientResponse(rule)}
                  >
                    <ResponseLabel>
                      Ответ если клиента нет в базе:
                      <EditHint>нажмите для редактирования</EditHint>
                    </ResponseLabel>
                    <ResponseText>
                      {rule.botNoClientResponse ||
                        "— Нажмите чтобы добавить ответ —"}
                    </ResponseText>
                  </ResponseBlock>
                )}

                {isEventsBot ? (
                  <EventBlock onClick={() => handleOpenEvent(rule)}>
                    <ResponseLabel>
                      Событие для рассылки:
                      <EditHint>нажмите для редактирования</EditHint>
                    </ResponseLabel>
                    <ResponseText>
                      {rule.event
                        ? getEventLabel(rule)
                        : "— Нажмите чтобы выбрать событие —"}
                      {getEventSchedule(rule)}
                    </ResponseText>
                  </EventBlock>
                ) : rule.keywords && rule.keywords.length > 0 ? (
                  <KeywordsBlock>
                    <KeywordsLabel>Ключевые слова:</KeywordsLabel>
                    <KeywordsList>
                      {rule.keywords.map((kw) => (
                        <KeywordChip
                          key={kw.id}
                          $color={getMatchTypeColor(kw.matchType)}
                          title={getMatchTypeLabel(kw.matchType)}
                        >
                          <KeywordChipMatchBadge>
                            {getMatchTypeLabel(kw.matchType)}
                          </KeywordChipMatchBadge>
                          <KeywordValue>"{kw.keyword}"</KeywordValue>
                          <RemoveChip
                            onClick={() => handleDeleteKeyword(kw.id, rule.id)}
                          >
                            ✕
                          </RemoveChip>
                        </KeywordChip>
                      ))}
                      <AddKeywordButton
                        onClick={() => handleOpenKeywords(rule)}
                        title="Добавить ключевое слово"
                      >
                        + Добавить
                      </AddKeywordButton>
                    </KeywordsList>
                  </KeywordsBlock>
                ) : (
                  <EmptyKeywords onClick={() => handleOpenKeywords(rule)}>
                    Нет ключевых слов — нажмите чтобы добавить
                  </EmptyKeywords>
                )}
              </RuleCard>
            );
          })}
        </RulesGrid>
      )}

      {/* Modal: создание/редактирование правила */}
      {ruleModal.isOpen && (
        <BaseModal
          title={
            ruleModal.editingRule ? "Редактировать правило" : "Новое правило"
          }
          onClose={() =>
            !ruleModal.saving &&
            setRuleModal((prev) => ({ ...prev, isOpen: false }))
          }
          onCancel={() => setRuleModal((prev) => ({ ...prev, isOpen: false }))}
          onSave={handleSaveRule}
          isSubmitting={ruleModal.saving}
          width="550px"
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Название правила</ModalLabel>
              <CustomInput
                value={ruleModal.name}
                onChange={(e) =>
                  setRuleModal((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Например: Приветствие"
                disabled={ruleModal.saving}
              />
            </ModalField>

            {!ruleModal.editingRule && (
              <ModalField>
                <ModalLabel>Тип правила</ModalLabel>
                <TypeOptions>
                  <TypeOption
                    type="button"
                    $selected={ruleModal.botType === "Keywords"}
                    onClick={() =>
                      setRuleModal((prev) => ({ ...prev, botType: "Keywords" }))
                    }
                    disabled={ruleModal.saving}
                  >
                    <TypeOptionTitle>По ключевым словам</TypeOptionTitle>
                    <TypeOptionHint>
                      Бот отвечает на сообщения, содержащие заданные слова
                    </TypeOptionHint>
                  </TypeOption>
                  <TypeOption
                    type="button"
                    $selected={ruleModal.botType === "Events"}
                    onClick={() =>
                      setRuleModal((prev) => ({ ...prev, botType: "Events" }))
                    }
                    disabled={ruleModal.saving}
                  >
                    <TypeOptionTitle>По событию</TypeOptionTitle>
                    <TypeOptionHint>
                      Бот делает рассылку при наступлении события
                    </TypeOptionHint>
                  </TypeOption>
                </TypeOptions>
              </ModalField>
            )}
          </ModalForm>
        </BaseModal>
      )}

      {/* Modal: конструктор ответа */}
      {responseModal.isOpen && responseModal.rule && (
        <BaseModal
          title={
            responseModal.kind === "noClient"
              ? `Ответ если клиента нет — ${responseModal.rule.name}`
              : `Конструктор ответа — ${responseModal.rule.name}`
          }
          onClose={() =>
            !responseModal.saving &&
            setResponseModal((prev) => ({ ...prev, isOpen: false }))
          }
          onCancel={() =>
            setResponseModal((prev) => ({ ...prev, isOpen: false }))
          }
          onSave={handleSaveResponse}
          isSubmitting={responseModal.saving}
          saveButtonText="Сохранить ответ"
          width="1100px"
          maxHeight="92vh"
        >
          <ModalForm>
            {responseModal.kind === "noClient" && (
              <NoClientHint>
                В этом ответе доступны только переменные группы «Глобальные —
                Компания»
              </NoClientHint>
            )}
            <BotResponseConstructor
              value={responseModal.response}
              onChange={(next) =>
                setResponseModal((prev) => ({ ...prev, response: next }))
              }
              disabled={responseModal.saving}
              mode={
                responseModal.kind === "noClient" ? "companyOnly" : "default"
              }
              event={
                responseModal.rule.botType === "Events"
                  ? responseModal.rule.event ?? null
                  : null
              }
            />
          </ModalForm>
        </BaseModal>
      )}

      {/* Modal: ключевые слова */}
      {keywordModal.isOpen && keywordModal.rule && (
        <BaseModal
          title={`Ключевые слова — ${keywordModal.rule.name}`}
          onClose={() =>
            !keywordModal.adding &&
            setKeywordModal((prev) => ({ ...prev, isOpen: false }))
          }
          onCancel={() =>
            setKeywordModal((prev) => ({ ...prev, isOpen: false }))
          }
          hideSaveButton
          cancelButtonText="Закрыть"
          width="550px"
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Тип совпадения</ModalLabel>
              <CustomSelect
                value={keywordModal.matchType}
                onChange={(e) =>
                  setKeywordModal((prev) => ({
                    ...prev,
                    matchType: e.target.value as
                      | "Exact"
                      | "Contains"
                      | "StartsWith",
                  }))
                }
                options={[
                  {
                    value: "Contains",
                    label: "Содержит — слово есть где-то в сообщении",
                  },
                  {
                    value: "StartsWith",
                    label: "Начинается с — сообщение начинается со слова",
                  },
                  {
                    value: "Exact",
                    label: "Точно совпадает — сообщение полностью равно слову",
                  },
                ]}
                disabled={keywordModal.adding}
              />
            </ModalField>

            <ModalField>
              <ModalLabel>Ключевое слово</ModalLabel>
              <AddKeywordRow>
                <CustomInput
                  value={keywordModal.keyword}
                  onChange={(e) =>
                    setKeywordModal((prev) => ({
                      ...prev,
                      keyword: e.target.value,
                    }))
                  }
                  placeholder="Введите ключевое слово..."
                  disabled={keywordModal.adding}
                  onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <DarkCyanButton
                  onClick={handleAddKeyword}
                  disabled={keywordModal.adding || !keywordModal.keyword.trim()}
                >
                  {keywordModal.adding ? "Добавление..." : "+ Добавить"}
                </DarkCyanButton>
              </AddKeywordRow>
            </ModalField>

            {keywordRule?.keywords && keywordRule.keywords.length > 0 && (
              <KeywordsSection>
                <ModalLabel>Список ключевых слов:</ModalLabel>
                <KeywordsListVertical>
                  {keywordRule.keywords.map((kw) => (
                    <KeywordRow key={kw.id}>
                      <KeywordMatchBadge
                        $color={getMatchTypeColor(kw.matchType)}
                      >
                        {getMatchTypeLabel(kw.matchType)}
                      </KeywordMatchBadge>
                      <KeywordText>"{kw.keyword}"</KeywordText>
                      <DeleteKeyword
                        onClick={() =>
                          handleDeleteKeyword(kw.id, keywordModal.rule!.id)
                        }
                      >
                        Удалить
                      </DeleteKeyword>
                    </KeywordRow>
                  ))}
                </KeywordsListVertical>
              </KeywordsSection>
            )}
          </ModalForm>
        </BaseModal>
      )}

      {/* Modal: событие */}
      {eventModal.isOpen && eventModal.rule && (
        <BaseModal
          title={`Событие для рассылки — ${eventModal.rule.name}`}
          onClose={() =>
            !eventModal.saving &&
            setEventModal((prev) => ({ ...prev, isOpen: false }))
          }
          onCancel={() => setEventModal((prev) => ({ ...prev, isOpen: false }))}
          onSave={handleSaveEvent}
          isSubmitting={eventModal.saving}
          width="550px"
        >
          <ModalForm>
            <ModalField>
              <ModalLabel>Событие</ModalLabel>
              <CustomSelect
                value={eventModal.eventType}
                onChange={(e) =>
                  setEventModal((prev) => ({
                    ...prev,
                    eventType: e.target.value as BotEventType,
                    eventDays: "",
                    eventHours: "",          // ← сбрасываем и часы
                  }))
                }
                options={EVENT_OPTIONS.map((opt) => ({
                  value: opt,
                  label: EVENT_LABEL[opt],
                }))}
                disabled={eventModal.saving}
                dropdownInPortal
              />
            </ModalField>

            {(eventModal.eventType === "ComingPayment" ||
              eventModal.eventType === "OverduePayment") && (
              <>
                <ModalField>
                  <ModalLabel>За сколько дней</ModalLabel>
                  <CustomInput
                    inputType="number"
                    value={eventModal.eventDays}
                    onChange={(e) =>
                      setEventModal((prev) => ({ ...prev, eventDays: e.target.value }))
                    }
                    placeholder="Например: 3"
                    disabled={eventModal.saving}
                  />
                </ModalField>

                <ModalField>
                  <ModalLabel>И часов (0–23)</ModalLabel>
                  <CustomInput
                    inputType="number"
                    value={eventModal.eventHours}
                    onChange={(e) =>
                      setEventModal((prev) => ({ ...prev, eventHours: e.target.value }))
                    }
                    placeholder="Не обязательно (установится 9)"
                    disabled={eventModal.saving}
                  />
                </ModalField>
              </>
            )}
          </ModalForm>
        </BaseModal>
      )}

      {/* Modal: подтверждение */}
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
          width="440px"
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

// ─── Styled components ────────────────────────────────────────────────────────

const LoadingText = styled.div`
  text-align: center;
  padding: 60px;
  color: #9ca3af;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  margin: 24px 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  color: #374151;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  color: #9ca3af;
  font-size: 14px;
`;

const RulesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 16px 24px;
`;

const RuleCard = styled.div<{ $isActive: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  opacity: ${(p) => (p.$isActive ? 1 : 0.6)};
  transition: box-shadow 0.2s;
  border: 1px solid #e5e7eb;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const CardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const RuleName = styled.h4`
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #111827;
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  background: ${(p) => (p.$isActive ? "#d1fae5" : "#f3f4f6")};
  color: ${(p) => (p.$isActive ? "#065f46" : "#6b7280")};
  border: 1px solid ${(p) => (p.$isActive ? "#a7f3d0" : "#d1d5db")};
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const TypeBadge = styled.span<{ $kind: BotType }>`
  background: ${(p) =>
    p.$kind === "Events"
      ? "rgba(124, 58, 237, 0.1)"
      : "rgba(0, 125, 136, 0.1)"};
  color: ${(p) => (p.$kind === "Events" ? "#7c3aed" : "#007d88")};
  border: 1px solid
    ${(p) =>
      p.$kind === "Events" ? "rgba(124,58,237,0.3)" : "rgba(0,125,136,0.3)"};
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: white;
  border: 1px solid #d1d5db;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    border-color: #007d88;
    color: #007d88;
    background: rgba(0, 125, 136, 0.04);
  }
`;

const ActionButtonDelete = styled(ActionButton)`
  &:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fef2f2;
  }
`;

const ResponseBlock = styled.div`
  background: #f9fafb;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;

  &:hover {
    background: #f0fdf9;
    border-color: rgba(0, 125, 136, 0.3);
  }
`;

const EventBlock = styled(ResponseBlock)`
  &:hover {
    background: rgba(124, 58, 237, 0.04);
    border-color: rgba(124, 58, 237, 0.3);
  }
`;

const ResponseLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditHint = styled.span`
  font-size: 11px;
  color: #007d88;
  font-weight: normal;
`;

const ResponseText = styled.div`
  font-size: 14px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
`;

const KeywordsBlock = styled.div`
  margin-top: 12px;
`;

const KeywordsLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 10px;
`;

const KeywordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const AddKeywordButton = styled.button`
  background: none;
  border: 1px dashed #d1d5db;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  color: #007d88;
  transition: all 0.15s;

  &:hover {
    border-color: #007d88;
    background: rgba(0, 125, 136, 0.06);
  }
`;

const KeywordChip = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: #f9fafb;
  border-radius: 20px;
  overflow: hidden;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-left: 3px solid ${(p) => p.$color};
`;

const KeywordChipMatchBadge = styled.span`
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
`;

const KeywordValue = styled.span`
  padding: 4px 8px 4px 10px;
  color: #374151;
  font-weight: 500;
`;

const RemoveChip = styled.button`
  background: none;
  border: none;
  border-left: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 12px;
  color: #9ca3af;
  padding: 4px 8px;
  height: 100%;
  transition: all 0.15s;

  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }
`;

const EmptyKeywords = styled.div`
  text-align: center;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  border: 1px dashed #d1d5db;
  transition: all 0.15s;
  margin-top: 12px;

  &:hover {
    border-color: #007d88;
    color: #007d88;
    background: rgba(0, 125, 136, 0.04);
  }
`;

const NoClientHint = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 30px 4px;
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

const FieldHint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
`;

const TypeOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const TypeOption = styled.button<{ $selected: boolean; disabled?: boolean }>`
  background: ${(p) => (p.$selected ? "rgba(0, 125, 136, 0.06)" : "white")};
  border: 2px solid ${(p) => (p.$selected ? "#007d88" : "#e5e7eb")};
  border-radius: 10px;
  padding: 14px 16px;
  text-align: left;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: #007d88;
  }
`;

const TypeOptionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const TypeOptionHint = styled.span`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
`;

const AddKeywordRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  > div {
    flex: 1;
  }
`;

const KeywordsSection = styled.div`
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

const KeywordsListVertical = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  max-height: 280px;
  overflow-y: auto;
`;

const KeywordRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const KeywordMatchBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.$color};
  background: ${(p) => p.$color}18;
  border: 1px solid ${(p) => p.$color}44;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const KeywordText = styled.span`
  font-size: 13px;
  color: #374151;
  flex: 1;
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
`;

const DeleteKeyword = styled.button`
  background: none;
  border: 1px solid #fecaca;
  color: #ef4444;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: #fef2f2;
  }
`;

export default BotManagementPage;
