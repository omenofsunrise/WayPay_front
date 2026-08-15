import React, { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import BackButtonComponent from "../../components/ui/Buttons/BackButton";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomInput from "../../components/ui/fields/CustomInput";
import useWhatsAppSender from "../../api/hooks/useWhatsAppSender";
import whatsappService from "../../api/services/whatsappService";
import type { BotResponse, ChannelResponse } from "../../api/types/whatsapp";
import type {
  WhatsAppSender,
  UpsertWhatsAppSenderRequest,
} from "../../api/types/whatsappSender";
import BotResponseConstructor from "./BotResponseConstructor";
import SenderReportModal from "./SenderReportModal";

// ─── Animations ───────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
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

const describeDays = (eventDays: number): string =>
  eventDays > 0 ? `За ${eventDays} дн. до платежа` : "В день платежа";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditState {
  isOpen: boolean;
  editing: WhatsAppSender | null;
  eventDays: string;
  pattern: string;
  saving: boolean;
}

const emptyEdit: EditState = {
  isOpen: false,
  editing: null,
  eventDays: "",
  pattern: "",
  saving: false,
};

interface BotsState {
  isOpen: boolean;
  sender: WhatsAppSender | null;
  selected: Set<number>;
  saving: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const WhatsAppSendersPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    senders,
    isLoading,
    error,
    loadSenders,
    createSender,
    updateSender,
    deleteSender,
    setSenderBots,
  } = useWhatsAppSender();

  const [edit, setEdit] = useState<EditState>(emptyEdit);
  const [reportOpen, setReportOpen] = useState(false);

  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [botsByChannel, setBotsByChannel] = useState<
    Record<string, BotResponse[]>
  >({});
  const [botsState, setBotsState] = useState<BotsState>({
    isOpen: false,
    sender: null,
    selected: new Set(),
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
    loadSenders();
  }, [loadSenders]);

  const loadAllBots = useCallback(async () => {
    const list = await whatsappService.getChannels();
    const chans = list.chanelResponses ?? [];
    setChannels(chans);
    const map: Record<string, BotResponse[]> = {};
    await Promise.all(
      chans.map(async (c) => {
        try {
          map[c.id] = await whatsappService.getBotsByChannel(c.id);
        } catch {
          map[c.id] = [];
        }
      })
    );
    setBotsByChannel(map);
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const openCreate = () => setEdit({ ...emptyEdit, isOpen: true });

  const openEdit = (sender: WhatsAppSender) =>
    setEdit({
      isOpen: true,
      editing: sender,
      eventDays: sender.eventDays ? String(sender.eventDays) : "",
      pattern: sender.pattern ?? "",
      saving: false,
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit.pattern.trim()) {
      addToast("warning", "Введите текст рассылки");
      return;
    }
    const body: UpsertWhatsAppSenderRequest = {
      type: "Schedule",
      eventDays: Number(edit.eventDays) || 0,
      pattern: edit.pattern,
    };
    setEdit((p) => ({ ...p, saving: true }));
    const ok = edit.editing
      ? await updateSender(edit.editing.id, body)
      : await createSender(body);
    setEdit((p) => ({ ...p, saving: false }));
    if (ok) {
      setEdit(emptyEdit);
      await loadSenders();
      addToast(
        "success",
        edit.editing ? "Рассылка обновлена" : "Рассылка создана"
      );
    } else {
      addToast("error", "Не удалось сохранить рассылку");
    }
  };

  const handleDelete = (sender: WhatsAppSender) => {
    openConfirm(`Удалить рассылку #${sender.id}?`, async () => {
      const ok = await deleteSender(sender.id);
      if (ok) {
        await loadSenders();
        addToast("success", "Рассылка удалена");
      } else {
        addToast("error", "Не удалось удалить рассылку");
      }
    });
  };

  // ── Боты ──────────────────────────────────────────────────────────────────

  const openBots = async (sender: WhatsAppSender) => {
    setBotsState({ isOpen: true, sender, selected: new Set(), saving: false });
    if (channels.length === 0) await loadAllBots();
  };

  const toggleBot = (botId: number) =>
    setBotsState((p) => {
      const next = new Set(p.selected);
      if (next.has(botId)) next.delete(botId);
      else next.add(botId);
      return { ...p, selected: next };
    });

  const handleSaveBots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botsState.sender) return;
    setBotsState((p) => ({ ...p, saving: true }));
    const ok = await setSenderBots(
      botsState.sender.id,
      Array.from(botsState.selected)
    );
    setBotsState((p) => ({ ...p, saving: false }));
    if (ok) {
      setBotsState({
        isOpen: false,
        sender: null,
        selected: new Set(),
        saving: false,
      });
      addToast("success", "Боты успешно назначены");
    } else {
      addToast("error", "Не удалось назначить ботов");
    }
  };

  const closeBots = () =>
    setBotsState({
      isOpen: false,
      sender: null,
      selected: new Set(),
      saving: false,
    });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout>
      <TitleField style={{ marginTop: 0 }}>
        <BackButtonComponent
          style={{ margin: 0, marginRight: 12 }}
          onClick={() => navigate(-1)}
        >
          Назад
        </BackButtonComponent>
        <CustomTitle style={{ margin: 0 }}>Рассылки</CustomTitle>
        <HeaderRight>
          <GrayButton onClick={() => setReportOpen(true)}>Отчёты</GrayButton>
          <DarkCyanButton onClick={openCreate}>+ Новая рассылка</DarkCyanButton>
        </HeaderRight>
      </TitleField>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {isLoading && senders.length === 0 ? (
        <MutedCenter>Загрузка…</MutedCenter>
      ) : senders.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📨</EmptyIcon>
          <EmptyTitle>Нет рассылок</EmptyTitle>
          <EmptyDescription>
            Создайте первую рассылку и назначьте на неё ботов
          </EmptyDescription>
          <DarkCyanButton onClick={openCreate}>
            + Создать рассылку
          </DarkCyanButton>
        </EmptyState>
      ) : (
        <Grid>
          {senders.map((sender) => (
            <Card key={sender.id}>
              <CardTop>
                <TypeBadge>{describeDays(sender.eventDays)}</TypeBadge>
                <SenderId>#{sender.id}</SenderId>
              </CardTop>
              <CardBody>
                <CardPreview>
                  {sender.pattern?.trim()
                    ? sender.pattern
                    : "— текст не задан —"}
                </CardPreview>
              </CardBody>
              <CardActions>
                <SmallBtn onClick={() => openBots(sender)}>Боты</SmallBtn>
                <SmallBtn onClick={() => openEdit(sender)}>Изменить</SmallBtn>
                <SmallBtnDanger onClick={() => handleDelete(sender)}>
                  Удалить
                </SmallBtnDanger>
              </CardActions>
            </Card>
          ))}
        </Grid>
      )}

      {/* ── Создание / редактирование ── */}
      {edit.isOpen && (
        <BaseModal
          title={edit.editing ? "Редактировать рассылку" : "Новая рассылка"}
          onClose={() => !edit.saving && setEdit(emptyEdit)}
          onCancel={() => !edit.saving && setEdit(emptyEdit)}
          onSave={handleSave}
          isSubmitting={edit.saving}
          isSaveDisabled={edit.saving || !edit.pattern.trim()}
          saveButtonText={edit.saving ? "Сохранение…" : "Сохранить"}
          width="1100px"
          maxHeight="95vh"
        >
          <EditModalBody>
            <FieldRow>
              <FieldLabel>За сколько дней до платежа</FieldLabel>
              <NarrowInput>
                <CustomInput
                  inputType="number"
                  value={edit.eventDays}
                  onChange={(e) =>
                    setEdit((p) => ({ ...p, eventDays: e.target.value }))
                  }
                  placeholder="Например: 3"
                  disabled={edit.saving}
                />
              </NarrowInput>
              <Hint>0 — отправить в день платежа</Hint>
            </FieldRow>

            <FieldRow>
              <FieldLabel>Текст рассылки</FieldLabel>
              <BotResponseConstructor
                value={edit.pattern}
                onChange={(next) => setEdit((p) => ({ ...p, pattern: next }))}
                disabled={edit.saving}
              />
            </FieldRow>
          </EditModalBody>
        </BaseModal>
      )}

      {/* ── Назначение ботов ── */}
      {botsState.isOpen && botsState.sender && (
        <BaseModal
          title={`Боты рассылки #${botsState.sender.id}`}
          onClose={() => !botsState.saving && closeBots()}
          onCancel={() => !botsState.saving && closeBots()}
          onSave={handleSaveBots}
          isSubmitting={botsState.saving}
          saveButtonText={botsState.saving ? "Сохранение…" : "Сохранить"}
          width="520px"
        >
          <BotsModalBody>
            <BotsHint>
              Отметьте ботов, которые будут отправлять эту рассылку. Сохранение
              заменяет весь список.
            </BotsHint>
            <BotsList>
              {channels.length === 0 ? (
                <MutedCenter>Загрузка ботов…</MutedCenter>
              ) : (
                channels.map((channel) => {
                  const bots = botsByChannel[channel.id] ?? [];
                  return (
                    <ChannelGroup key={channel.id}>
                      <ChannelName>
                        {channel.name || channel.phone || channel.id}
                      </ChannelName>
                      {bots.length === 0 ? (
                        <MutedSmall>Нет ботов</MutedSmall>
                      ) : (
                        bots.map((bot) => (
                          <BotRow
                            key={bot.id}
                            $checked={botsState.selected.has(bot.id)}
                            onClick={() => toggleBot(bot.id)}
                          >
                            <BotCheckbox
                              type="checkbox"
                              checked={botsState.selected.has(bot.id)}
                              onChange={() => toggleBot(bot.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>{bot.name || `Бот #${bot.id}`}</span>
                          </BotRow>
                        ))
                      )}
                    </ChannelGroup>
                  );
                })
              )}
            </BotsList>
          </BotsModalBody>
        </BaseModal>
      )}

      {/* ── Подтверждение ── */}
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

      <SenderReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />

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

export default WhatsAppSendersPage;

// ─── Styled components ─────────────────────────────────────────────────────────

const HeaderRight = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
`;

const MutedCenter = styled.div`
  color: #9ca3af;
  font-size: 14px;
  padding: 40px;
  text-align: center;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 4px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.11);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardBody = styled.div`
  flex: 1;
  min-height: 48px;
`;

const CardPreview = styled.div`
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TypeBadge = styled.span`
  background: rgba(0, 125, 136, 1);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const SenderId = styled.span`
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
`;

const SmallBtn = styled.button`
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
    color: rgba(0, 125, 136, 1);
  }
`;

const SmallBtnDanger = styled(SmallBtn)`
  &:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fff1f0;
  }
`;

// ─── Edit modal ───────────────────────────────────────────────────────────────

const EditModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 24px 8px;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const NarrowInput = styled.div`
  max-width: 220px;
`;

const Hint = styled.div`
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
`;

// ─── Bots modal ───────────────────────────────────────────────────────────────

const BotsModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 24px 8px;
`;

const BotsHint = styled.div`
  font-size: 13px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  line-height: 1.5;
`;

const BotsList = styled.div`
  max-height: 340px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 2px;
`;

const ChannelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChannelName = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 6px 0 2px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 4px;
`;

const MutedSmall = styled.div`
  color: #9ca3af;
  font-size: 13px;
  padding: 4px 12px;
`;

const BotRow = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid ${(p) => (p.$checked ? "rgba(0,125,136,1)" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${(p) => (p.$checked ? "rgba(0,125,136,0.04)" : "white")};
  font-size: 14px;
  color: #374151;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const BotCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: rgba(0, 125, 136, 1);
`;
