/**
 * Frontend-зеркало бэкендовых типов.
 *
 * ВАЖНО: бэкенд сериализует [Flags] BackupItems как СТРОКУ
 * через JsonStringEnumConverter — например "Credits, Clients".
 * При этом на запись он принимает и число (allowIntegerValues),
 * и строку. Поэтому normalizeItems принимает оба варианта.
 *
 * UI управляет только флагом Credits (тихий внутренний контракт).
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
  /**
   * Бэкенд может прислать:
   *   - число: 1, 3, ...
   *   - строку с именами: "Credits", "Credits, Clients"
   *   - строку с числом: "3"
   *   - пустую строку / null
   * Всегда нормализуем через normalizeItems().
   */
  items: number | string | null;
}

export interface ExcellBackupSubscriptionPayload {
  messenger: Messenger;
  contact: string;
  items: number;
}

/**
 * Приводит items к числовому флагу. Понимает все форматы,
 * которые может прислать System.Text.Json с JsonStringEnumConverter.
 */
export const normalizeItems = (raw: unknown): number => {
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;

  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return 0;

    // "3" — числовая строка
    if (/^-?\d+$/.test(t)) return Number(t);

    // "Credits, Clients" — список имён
    return t
      .split(",")
      .map((part) => part.trim())
      .reduce<number>((acc, name) => {
        const flag = (BACKUP_ITEM as Record<string, number>)[name];
        return typeof flag === "number" ? acc | flag : acc;
      }, 0);
  }

  return 0;
};

export const hasItem = (items: unknown, flag: number): boolean =>
  (normalizeItems(items) & flag) !== 0;

export const toggleFlag = (
  items: unknown,
  flag: number,
  on: boolean
): number => {
  const current = normalizeItems(items);
  return on ? current | flag : current & ~flag;
};

export const messengerLabel = (value: unknown): string => {
  if (typeof value === "string") {
    return MESSENGER_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }
  if (typeof value === "number") {
    return MESSENGER_OPTIONS[value]?.label ?? String(value);
  }
  return "—";
};