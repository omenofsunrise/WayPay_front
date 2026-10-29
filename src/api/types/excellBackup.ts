/**
 * Frontend-зеркало бэкендовых типов.
 *
 * ВАЖНО про сериализацию на бэке:
 *   - BackupItems [Flags] — отправляем и читаем числом. Работает и с
 *     дефолтным System.Text.Json, и с JsonStringEnumConverter
 *     (allowIntegerValues по умолчанию true).
 *   - Messenger — строкой, как role/status в других сущностях. Нужен
 *     JsonStringEnumConverter на бэке (глобально или на DTO).
 */

export const BACKUP_ITEM = {
  Credits: 1 << 0,
  Clients: 1 << 1,
} as const;

export const MESSENGER_OPTIONS = [
  { value: "Telegram", label: "Telegram" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Email", label: "Почта" },
] as const;

export type Messenger = (typeof MESSENGER_OPTIONS)[number]["value"];

export interface ExcellBackupSubscription {
  id: number;
  messenger: Messenger | string;
  contact: string;
  items: number;
}

export interface ExcellBackupSubscriptionPayload {
  messenger: Messenger;
  contact: string;
  items: number;
}

export const hasItem = (items: number, flag: number): boolean =>
  (items & flag) !== 0;

export const toggleFlag = (items: number, flag: number, on: boolean): number =>
  on ? items | flag : items & ~flag;

export const messengerLabel = (value: unknown): string => {
  if (typeof value === "string") {
    return MESSENGER_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }
  if (typeof value === "number") {
    return MESSENGER_OPTIONS[value]?.label ?? String(value);
  }
  return "—";
};