import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import telegramCollectorService from "../../../api/services/telegramCollectorService";
import type {
  CollectorAccount,
  CollectorAccountStatus,
  CollectorChat,
  CollectorMarkAsRead,
  LoginStep,
} from "../../../api/types/telegramCollector";
import BaseModal from "../../modal/BASE/modalCRUBase";
import DarkCyanButton from "../../ui/Buttons/DarkCyanButton";
import CustomInput from "../../ui/fields/CustomInput";
import CustomSelect from "../../ui/fields/CustomSelect";
import ToggleSwitch from "../../ui/Toggles/ToggleSwitch";
import {
  Actions,
  Badge,
  type BadgeTone,
  Card,
  CardHeader,
  Column,
  Empty,
  ErrorMessage,
  Field,
  formatDateTime,
  getErrorMessage,
  Hint,
  Label,
  ModalForm,
  Muted,
  SecondaryButton,
  SuccessMessage,
  Title,
  Toolbar,
} from "./ui";

const STATUS_BADGE: Record<CollectorAccountStatus, [string, BadgeTone]> = {
  Connected: ["Подключён", "green"],
  WaitingCode: ["Ждёт код", "amber"],
  WaitingPassword: ["Ждёт пароль", "amber"],
  Disconnected: ["Не подключён", "gray"],
  SessionLost: ["Нужен вход", "red"],
};

const MARK_AS_READ_OPTIONS: { value: CollectorMarkAsRead; label: string }[] = [
  { value: "Off", label: "Не отмечать" },
  { value: "GroupsOnly", label: "Только группы и каналы" },
  { value: "All", label: "Везде, включая личные чаты" },
];

interface Props {
  canConnect: boolean;
  onChanged: () => void;
}

/** Telegram-аккаунты сборщика: подключение, настройки, выбор чатов. */
const AccountsPanel = ({ canConnect, onChanged }: Props) => {
  const [accounts, setAccounts] = useState<CollectorAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [chatsAccount, setChatsAccount] = useState<CollectorAccount | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAccounts(await telegramCollectorService.getAccounts());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async (account: CollectorAccount, patch: Partial<CollectorAccount>) => {
    const next = { ...account, ...patch };
    setBusyId(account.id);
    setError(null);
    setSuccess(null);
    try {
      await telegramCollectorService.updateSettings(account.id, {
        readAllChats: next.readAllChats,
        markAsRead: next.markAsRead,
        autoAdd: next.autoAdd,
      });
      setAccounts((current) => current.map((a) => (a.id === account.id ? next : a)));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async (account: CollectorAccount) => {
    if (!window.confirm(`Отключить аккаунт ${account.phone}? Сборщик перестанет читать его чаты.`)) return;
    setBusyId(account.id);
    setError(null);
    try {
      await telegramCollectorService.logout(account.id);
      setSuccess(`Аккаунт ${account.phone} отключён`);
      await load();
      onChanged();
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Column>
      <Toolbar>
        <Muted>
          Сборщик входит в аккаунт как ещё одно устройство и читает текст из выбранных чатов.
          Сеанс будет виден в Telegram в «Настройки → Устройства».
        </Muted>
        <ConnectButton>
          <DarkCyanButton disabled={!canConnect} onClick={() => setLoginPhone("")}>
            + Подключить аккаунт
          </DarkCyanButton>
        </ConnectButton>
      </Toolbar>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isLoading && accounts.length === 0 && (
        <Empty>Аккаунтов пока нет. Подключите Telegram-аккаунт, который состоит в нужных чатах.</Empty>
      )}

      {accounts.map((account) => {
        const [statusText, statusTone] = STATUS_BADGE[account.status];
        const busy = busyId === account.id;
        const connected = account.status === "Connected";
        return (
          <Card key={account.id}>
            <CardHeader>
              <div>
                <Title>{account.displayName || account.phone}</Title>
                <Muted>
                  {account.phone}
                  {account.connectedAt ? ` · подключён ${formatDateTime(account.connectedAt)}` : ""}
                </Muted>
              </div>
              <Badge $tone={connected && !account.running ? "amber" : statusTone}>
                {connected && !account.running ? "Подключён, не запущен" : statusText}
              </Badge>
            </CardHeader>

            {account.lastError && <ErrorMessage>{account.lastError}</ErrorMessage>}

            {connected && (
              <Settings>
                <SettingRow>
                  <ToggleSwitch
                    checked={account.readAllChats}
                    disabled={busy}
                    onChange={(checked) => saveSettings(account, { readAllChats: checked })}
                  />
                  <div>
                    <SettingTitle>Читать все чаты</SettingTitle>
                    <Hint>
                      Иначе — только отмеченные ({account.chatsEnabled} из {account.chatsTotal}).
                    </Hint>
                  </div>
                </SettingRow>
                <SettingRow>
                  <ToggleSwitch
                    checked={account.autoAdd}
                    disabled={busy}
                    onChange={(checked) => saveSettings(account, { autoAdd: checked })}
                  />
                  <div>
                    <SettingTitle>Сразу добавлять уверенные находки в ЧС+</SettingTitle>
                    <Hint>
                      Только если нейросеть уверена и есть телефон. Остальное ждёт проверки.
                    </Hint>
                  </div>
                </SettingRow>
                <SelectRow>
                  <SettingTitle>Отмечать прочитанным</SettingTitle>
                  <SelectBox>
                    <CustomSelect
                      value={account.markAsRead}
                      options={MARK_AS_READ_OPTIONS}
                      disabled={busy}
                      onChange={(event) => saveSettings(account, { markAsRead: event.target.value })}
                    />
                  </SelectBox>
                  <Hint>
                    В личных чатах отправитель увидит «прочитано», в группах до 100 человек — аккаунт
                    в списке прочитавших.
                  </Hint>
                </SelectRow>
              </Settings>
            )}

            <Actions>
              {connected ? (
                <DarkCyanButton disabled={busy} onClick={() => setChatsAccount(account)}>
                  Чаты ({account.chatsEnabled} из {account.chatsTotal})
                </DarkCyanButton>
              ) : (
                <DarkCyanButton disabled={busy || !canConnect} onClick={() => setLoginPhone(account.phone)}>
                  Войти заново
                </DarkCyanButton>
              )}
              {account.status !== "Disconnected" && (
                <SecondaryButton $danger disabled={busy} onClick={() => handleLogout(account)}>
                  Отключить
                </SecondaryButton>
              )}
            </Actions>
          </Card>
        );
      })}

      {loginPhone !== null && (
        <LoginModal
          initialPhone={loginPhone}
          onClose={() => setLoginPhone(null)}
          onDone={async () => {
            setLoginPhone(null);
            setSuccess("Аккаунт подключён. Отметьте чаты, которые нужно читать.");
            await load();
            onChanged();
          }}
        />
      )}

      {chatsAccount && (
        <ChatsModal
          account={chatsAccount}
          onClose={async () => {
            setChatsAccount(null);
            await load();
          }}
        />
      )}
    </Column>
  );
};

// ==================== Вход в аккаунт ====================

interface LoginProps {
  initialPhone: string;
  onClose: () => void;
  onDone: () => void;
}

const LoginModal = ({ initialPhone, onClose, onDone }: LoginProps) => {
  const [step, setStep] = useState<LoginStep | "Phone">("Phone");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result =
        step === "Phone"
          ? await telegramCollectorService.startLogin(phone)
          : await telegramCollectorService.continueLogin(accountId!, value);
      setAccountId(result.accountId);
      setValue("");
      if (result.step === "Done") onDone();
      else setStep(result.step);
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      title="Подключение Telegram-аккаунта"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
      saveButtonText={step === "Phone" ? "Получить код" : "Войти"}
    >
      <ModalForm>
        {step === "Phone" && (
          <Field>
            <Label>Номер телефона аккаунта</Label>
            <CustomInput
              autoFocus
              value={phone}
              placeholder="+7 928 123-45-67"
              onChange={(e) => setPhone(e.target.value)}
            />
            <Hint>Telegram пришлёт код в приложение на этом аккаунте (не по SMS).</Hint>
          </Field>
        )}
        {step === "Code" && (
          <Field>
            <Label>Код из Telegram</Label>
            <CustomInput
              autoFocus
              inputMode="numeric"
              value={value}
              placeholder="12345"
              onChange={(e) => setValue(e.target.value)}
            />
            <Hint>Код пришёл в чат «Telegram» в приложении. Не пересылайте его никому.</Hint>
          </Field>
        )}
        {step === "Password" && (
          <Field>
            <Label>Облачный пароль</Label>
            <CustomInput
              autoFocus
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Hint>На аккаунте включена двухэтапная проверка — введите её пароль.</Hint>
          </Field>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ModalForm>
    </BaseModal>
  );
};

// ==================== Чаты аккаунта ====================

const HISTORY_OPTIONS = [
  { value: 7, label: "7 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
];

const PEER_LABEL = { User: "личный", Chat: "группа", Channel: "канал / супергруппа" } as const;

interface ChatsProps {
  account: CollectorAccount;
  onClose: () => void;
}

const ChatsModal = ({ account, onClose }: ChatsProps) => {
  const [chats, setChats] = useState<CollectorChat[]>([]);
  const [search, setSearch] = useState("");
  const [historyDays, setHistoryDays] = useState(30);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setChats(await telegramCollectorService.getChats(account.id));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [account.id]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? chats.filter((c) => c.title.toLowerCase().includes(q)) : chats;
  }, [chats, search]);

  const toggle = async (chat: CollectorChat, enabled: boolean) => {
    setBusyId(chat.id);
    setError(null);
    try {
      await telegramCollectorService.setChatEnabled(chat.id, enabled);
      setChats((current) => current.map((c) => (c.id === chat.id ? { ...c, enabled } : c)));
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setBusyId(null);
    }
  };

  const loadHistory = async (chat: CollectorChat) => {
    setBusyId(chat.id);
    setError(null);
    setSuccess(null);
    try {
      setSuccess(`«${chat.title}»: ${await telegramCollectorService.loadHistory(chat.id, historyDays)}`);
    } catch (historyError) {
      setError(getErrorMessage(historyError));
    } finally {
      setBusyId(null);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await telegramCollectorService.refreshChats(account.id);
      await load();
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <BaseModal
      title={`Чаты: ${account.displayName || account.phone}`}
      onClose={onClose}
      onCancel={onClose}
      hideSaveButton
      cancelButtonText="Закрыть"
      width="760px"
    >
      <ModalForm>
        <Toolbar>
          <ChatSearch>
            <CustomInput value={search} placeholder="Поиск чата" onChange={(e) => setSearch(e.target.value)} />
          </ChatSearch>
          <SecondaryButton disabled={isRefreshing} onClick={refresh}>
            {isRefreshing ? "Обновление…" : "Обновить список"}
          </SecondaryButton>
        </Toolbar>
        <Hint>
          {account.readAllChats
            ? "Включено «Читать все чаты» — отметки ниже не нужны."
            : "Новые сообщения читаются только из отмеченных чатов, начиная с момента отметки."}{" "}
          «Разобрать историю» отправит на разбор старые сообщения за выбранный срок.
        </Hint>
        <HistoryRow>
          <Label>Срок истории</Label>
          <SelectBox>
            <CustomSelect
              value={historyDays}
              options={HISTORY_OPTIONS}
              onChange={(event) => setHistoryDays(Number(event.target.value))}
            />
          </SelectBox>
        </HistoryRow>

        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ChatList>
          {visible.length === 0 && <Muted>Чатов нет — нажмите «Обновить список».</Muted>}
          {visible.map((chat) => (
            <ChatRow key={chat.id}>
              <ToggleSwitch
                checked={account.readAllChats || chat.enabled}
                disabled={account.readAllChats || busyId === chat.id}
                onChange={(checked) => toggle(chat, checked)}
              />
              <ChatTitle>
                <div>{chat.title || "Без названия"}</div>
                <Muted>{PEER_LABEL[chat.peerType]}</Muted>
              </ChatTitle>
              <SecondaryButton disabled={busyId === chat.id} onClick={() => loadHistory(chat)}>
                Разобрать историю
              </SecondaryButton>
            </ChatRow>
          ))}
        </ChatList>
      </ModalForm>
    </BaseModal>
  );
};

const ConnectButton = styled.div`
  button {
    width: auto;
    padding: 0 18px;
    min-height: 40px;
  }
`;

const Settings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f9fafb;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const SelectRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SettingTitle = styled.div`
  color: #344054;
  font-size: 14px;
  font-weight: 600;
`;

const SelectBox = styled.div`
  width: min(320px, 100%);
`;

const ChatSearch = styled.div`
  width: min(360px, 100%);
`;

const HistoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
`;

const ChatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef0f3;

  &:last-child {
    border-bottom: 0;
  }
`;

const ChatTitle = styled.div`
  flex: 1;
  min-width: 0;
  color: #101828;
  font-size: 14px;

  div:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export default AccountsPanel;
