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
import {
  buildCron,
  parseCron,
  describeCron,
  describeSchedule,
  defaultSchedule,
  FREQUENCY_LABEL,
  WEEKDAYS,
  type Frequency,
} from "./cronSchedule";
import SenderReportModal from "./SenderReportModal";

interface EditState {
  isOpen: boolean;
  editing: WhatsAppSender | null;
  eventDays: string;
  // Конструктор расписания
  frequency: Frequency;
  time: string;
  weekday: number;
  monthday: number;
  manual: boolean; // ручной ввод cron
  pattern: string; // используется в ручном режиме
  saving: boolean;
}

const emptyEdit: EditState = {
  isOpen: false,
  editing: null,
  eventDays: "",
  frequency: defaultSchedule.frequency,
  time: defaultSchedule.time,
  weekday: defaultSchedule.weekday,
  monthday: defaultSchedule.monthday,
  manual: false,
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

  const openEdit = (sender: WhatsAppSender) => {
    const parsed = parseCron(sender.pattern ?? "");
    setEdit({
      isOpen: true,
      editing: sender,
      eventDays: sender.eventDays ? String(sender.eventDays) : "",
      frequency: parsed?.frequency ?? defaultSchedule.frequency,
      time: parsed?.time ?? defaultSchedule.time,
      weekday: parsed?.weekday ?? defaultSchedule.weekday,
      monthday: parsed?.monthday ?? defaultSchedule.monthday,
      // Нераспознанный шаблон открываем в ручном режиме.
      manual: !parsed && !!sender.pattern,
      pattern: sender.pattern ?? "",
      saving: false,
    });
  };

  const handleSave = async () => {
    const pattern = edit.manual
      ? edit.pattern.trim()
      : buildCron({
          frequency: edit.frequency,
          time: edit.time,
          weekday: edit.weekday,
          monthday: edit.monthday,
        });

    if (!pattern) {
      alert("Укажите расписание");
      return;
    }
    const body: UpsertWhatsAppSenderRequest = {
      type: "Schedule",
      eventDays: Number(edit.eventDays) || 0,
      pattern,
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
                <TypeBadge>По расписанию</TypeBadge>
                <SenderId>#{sender.id}</SenderId>
              </CardTop>
              <CardBody>
                <CardWhen>
                  {sender.pattern
                    ? describeCron(sender.pattern)
                    : "— расписание не задано —"}
                </CardWhen>
                {sender.pattern && <CardCron>{sender.pattern}</CardCron>}
                {sender.eventDays > 0 && (
                  <CardSub>за {sender.eventDays} дн. до платежа</CardSub>
                )}
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
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {edit.editing ? "Редактировать рассылку" : "Новая рассылка"}
              </ModalTitle>
              <Close onClick={() => !edit.saving && setEdit(emptyEdit)}>
                ✖
              </Close>
            </ModalHeader>

            <Field>
              <ScheduleHead>
                <FieldLabel>Расписание</FieldLabel>
                <ModeToggle
                  type="button"
                  onClick={() => setEdit((p) => ({ ...p, manual: !p.manual }))}
                >
                  {edit.manual ? "Простой режим" : "Ручной ввод (cron)"}
                </ModeToggle>
              </ScheduleHead>

              {edit.manual ? (
                <>
                  <CustomInput
                    value={edit.pattern}
                    onChange={(e) =>
                      setEdit((p) => ({ ...p, pattern: e.target.value }))
                    }
                    placeholder="0 10 * * *"
                    disabled={edit.saving}
                  />
                  <Hint>
                    Формат cron: «минуты часы день месяц день-недели». Напр. «0
                    10 * * *» — каждый день в 10:00.
                  </Hint>
                </>
              ) : (
                <>
                  <ScheduleRow>
                    <Select
                      value={edit.frequency}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          frequency: e.target.value as Frequency,
                        }))
                      }
                      disabled={edit.saving}
                    >
                      {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map(
                        (f) => (
                          <option key={f} value={f}>
                            {FREQUENCY_LABEL[f]}
                          </option>
                        )
                      )}
                    </Select>

                    {edit.frequency === "weekly" && (
                      <Select
                        value={edit.weekday}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            weekday: Number(e.target.value),
                          }))
                        }
                        disabled={edit.saving}
                      >
                        {WEEKDAYS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                    )}

                    {edit.frequency === "monthly" && (
                      <Select
                        value={edit.monthday}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            monthday: Number(e.target.value),
                          }))
                        }
                        disabled={edit.saving}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d}>
                              {d}-го числа
                            </option>
                          )
                        )}
                      </Select>
                    )}

                    <TimeInput
                      type="time"
                      value={edit.time}
                      onChange={(e) =>
                        setEdit((p) => ({ ...p, time: e.target.value }))
                      }
                      disabled={edit.saving}
                    />
                  </ScheduleRow>
                  <ScheduleSummary>
                    {describeSchedule({
                      frequency: edit.frequency,
                      time: edit.time,
                      weekday: edit.weekday,
                      monthday: edit.monthday,
                    })}
                  </ScheduleSummary>
                </>
              )}
            </Field>
            <Field>
              <FieldLabel>
                За сколько дней до платежа (необязательно)
              </FieldLabel>
              <CustomInput
                inputType="number"
                value={edit.eventDays}
                onChange={(e) =>
                  setEdit((p) => ({ ...p, eventDays: e.target.value }))
                }
                placeholder="Например: 3"
                disabled={edit.saving}
              />
              <Hint>
                0 — слать в день платежа. Заменяет прежний бот-ивент
                «Приближающийся платёж».
              </Hint>
            </Field>

            <ModalActions>
              <GrayButton
                onClick={() => setEdit(emptyEdit)}
                disabled={edit.saving}
              >
                Отмена
              </GrayButton>
              <DarkCyanButton onClick={handleSave} disabled={edit.saving}>
                {edit.saving ? "Сохранение…" : "Сохранить"}
              </DarkCyanButton>
            </ModalActions>
          </ModalContent>
        </Overlay>
      )}

      {/* Назначение ботов */}
      {botsState.isOpen && botsState.sender && (
        <Overlay
          onClick={() =>
            !botsState.saving &&
            setBotsState({
              isOpen: false,
              sender: null,
              selected: new Set(),
              saving: false,
            })
          }
        >
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Боты рассылки #{botsState.sender.id}</ModalTitle>
              <Close
                onClick={() =>
                  !botsState.saving &&
                  setBotsState({
                    isOpen: false,
                    sender: null,
                    selected: new Set(),
                    saving: false,
                  })
                }
              >
                ✖
              </Close>
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
              <GrayButton
                onClick={() =>
                  setBotsState({
                    isOpen: false,
                    sender: null,
                    selected: new Set(),
                    saving: false,
                  })
                }
                disabled={botsState.saving}
              >
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

const CardWhen = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const CardCron = styled.code`
  font-size: 11.5px;
  color: #94a3b8;
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
  word-break: break-word;
`;

const CardSub = styled.div`
  font-size: 12.5px;
  color: #64748b;
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

const Select = styled.select`
  flex: 1;
  min-width: 130px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const ScheduleHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ModeToggle = styled.button`
  background: none;
  border: none;
  color: #007d88;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const ScheduleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TimeInput = styled.input`
  width: 110px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const ScheduleSummary = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #007d88;
  font-weight: 600;
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
