import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import GrayButton from "../../components/ui/Buttons/GrayButton";
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

// Описание, за сколько дней до платежа уходит рассылка.
const describeDays = (eventDays: number): string =>
  eventDays > 0 ? `За ${eventDays} дн. до платежа` : "В день платежа";

interface EditState {
  isOpen: boolean;
  editing: WhatsAppSender | null;
  eventDays: string;
  pattern: string; // текст рассылки (шаблон из конструктора)
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

  // Боты по каналам — для назначения на рассылку.
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

  // === CRUD ===
  const openCreate = () => setEdit({ ...emptyEdit, isOpen: true });

  const openEdit = (sender: WhatsAppSender) =>
    setEdit({
      isOpen: true,
      editing: sender,
      eventDays: sender.eventDays ? String(sender.eventDays) : "",
      pattern: sender.pattern ?? "",
      saving: false,
    });

  const handleSave = async () => {
    if (!edit.pattern.trim()) {
      alert("Введите текст рассылки");
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
    } else {
      alert("Не удалось сохранить рассылку");
    }
  };

  const handleDelete = async (sender: WhatsAppSender) => {
    if (!window.confirm(`Удалить рассылку #${sender.id}?`)) return;
    const ok = await deleteSender(sender.id);
    if (ok) await loadSenders();
    else alert("Не удалось удалить рассылку");
  };

  // === Назначение ботов ===
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

  const handleSaveBots = async () => {
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
      alert("Боты назначены");
    } else {
      alert("Не удалось назначить ботов");
    }
  };

  const closeBots = () =>
    setBotsState({
      isOpen: false,
      sender: null,
      selected: new Set(),
      saving: false,
    });

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
        <Title>Рассылки</Title>
        <Actions>
          <GrayButton onClick={() => setReportOpen(true)}>Отчёты</GrayButton>
          <DarkCyanButton onClick={openCreate}>+ Новая рассылка</DarkCyanButton>
        </Actions>
      </Header>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {isLoading && senders.length === 0 ? (
        <Muted>Загрузка…</Muted>
      ) : senders.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Нет рассылок</EmptyTitle>
          <EmptyText>
            Создайте первую рассылку и назначьте на неё ботов
          </EmptyText>
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

      {/* Создание / редактирование */}
      {edit.isOpen && (
        <Overlay onClick={() => !edit.saving && setEdit(emptyEdit)}>
          <WideModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {edit.editing ? "Редактировать рассылку" : "Новая рассылка"}
              </ModalTitle>
              <Close onClick={() => !edit.saving && setEdit(emptyEdit)}>
                ✖
              </Close>
            </ModalHeader>

            <Field>
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
              <Hint>
                0 — слать в день платежа. Заменяет прежний бот-ивент
                «Приближающийся платёж».
              </Hint>
            </Field>

            <Field>
              <FieldLabel>Текст рассылки</FieldLabel>
              <BotResponseConstructor
                value={edit.pattern}
                onChange={(next) => setEdit((p) => ({ ...p, pattern: next }))}
                disabled={edit.saving}
              />
            </Field>

            <ModalActions>
              <GrayButton
                onClick={() => setEdit(emptyEdit)}
                disabled={edit.saving}
              >
                Отмена
              </GrayButton>
              <DarkCyanButton
                onClick={handleSave}
                disabled={edit.saving || !edit.pattern.trim()}
              >
                {edit.saving ? "Сохранение…" : "Сохранить"}
              </DarkCyanButton>
            </ModalActions>
          </WideModalContent>
        </Overlay>
      )}

      {/* Назначение ботов */}
      {botsState.isOpen && botsState.sender && (
        <Overlay onClick={() => !botsState.saving && closeBots()}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Боты рассылки #{botsState.sender.id}</ModalTitle>
              <Close onClick={() => !botsState.saving && closeBots()}>✖</Close>
            </ModalHeader>

            <Hint>
              Отметьте ботов, которые будут отправлять эту рассылку. Сохранение
              заменяет весь список ботов рассылки.
            </Hint>

            <BotsList>
              {channels.length === 0 ? (
                <Muted>Загрузка ботов…</Muted>
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
                          <BotRow key={bot.id}>
                            <input
                              type="checkbox"
                              checked={botsState.selected.has(bot.id)}
                              onChange={() => toggleBot(bot.id)}
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

            <ModalActions>
              <GrayButton onClick={closeBots} disabled={botsState.saving}>
                Отмена
              </GrayButton>
              <DarkCyanButton
                onClick={handleSaveBots}
                disabled={botsState.saving}
              >
                {botsState.saving ? "Сохранение…" : "Сохранить"}
              </DarkCyanButton>
            </ModalActions>
          </ModalContent>
        </Overlay>
      )}

      <SenderReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </Container>
  );
};

export default WhatsAppSendersPage;

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #007d88;
  padding: 8px 12px;
  border-radius: 6px;
  &:hover {
    background: #e8e8e8;
  }
`;

const Title = styled(CustomTitle)`
  margin: 0;
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Muted = styled.div`
  color: #6b7280;
  padding: 20px;
`;

const MutedSmall = styled.div`
  color: #9ca3af;
  font-size: 13px;
  padding: 4px 0 4px 24px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  color: #999;
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 40px;
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
  background: #007d88;
  color: #fff;
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
  margin-top: auto;
`;

const SmallBtn = styled.button`
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  &:hover {
    border-color: #007d88;
    color: #007d88;
  }
`;

const SmallBtnDanger = styled(SmallBtn)`
  &:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fff1f0;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 520px;
  max-width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 26px;
`;

const WideModalContent = styled(ModalContent)`
  width: 1100px;
  max-width: 95vw;
  max-height: 92vh;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 19px;
  font-weight: 600;
  margin: 0;
  color: #111827;
`;

const Close = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  &:hover {
    color: #111827;
  }
`;

const Field = styled.div`
  margin-bottom: 18px;
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const NarrowInput = styled.div`
  max-width: 220px;
`;

const Hint = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.4;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const BotsList = styled.div`
  max-height: 340px;
  overflow-y: auto;
  margin: 12px 0;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
`;

const ChannelGroup = styled.div`
  margin-bottom: 12px;
`;

const ChannelName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
`;

const BotRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0 6px 24px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
`;
