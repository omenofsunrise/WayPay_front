import { useEffect, useState } from "react";

export type CreditsDisplayMode = "pagination" | "list";

/** Правило окраски: за сколько дней до платежа и каким цветом. */
export interface PaymentColorRule {
  days: number;
  color: string;
}

export interface UiSettings {
  creditsDisplayMode: CreditsDisplayMode;
  paymentsDisplayMode: CreditsDisplayMode;
  paymentColorRules: PaymentColorRule[];
}

const STORAGE_KEY = "uiSettings";
const SETTINGS_EVENT = "uiSettingsChanged";

const defaultSettings: UiSettings = {
  creditsDisplayMode: "pagination",
  paymentsDisplayMode: "pagination",
  // Пусто — выдача выглядит как раньше. Правила заводит каждый под себя.
  paymentColorRules: [],
};

const readSettings = (): UiSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
};

export const getUiSettings = (): UiSettings => readSettings();

export const setUiSettings = (patch: Partial<UiSettings>) => {
  const next = { ...readSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: next }));
};

export const useUiSettings = (): UiSettings => {
  const [settings, setSettings] = useState<UiSettings>(readSettings);

  useEffect(() => {
    const handleChange = (e: Event) => {
      const detail = (e as CustomEvent<UiSettings>).detail;
      if (detail) {
        setSettings(detail);
      } else {
        setSettings(readSettings());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(readSettings());
    };
    window.addEventListener(SETTINGS_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return settings;
};

/**
 * Цвет для ожидаемого платежа по правилам из настроек.
 *
 * Правило срабатывает, когда до платежа осталось не больше указанных дней.
 * Если подходят несколько, берём самое узкое: «за 3 дня» важнее, чем «за 7».
 * Просроченные не трогаем — у них своя раскраска, и перебивать её незачем.
 */
export const colorForPaymentDate = (
  date: Date | string | null | undefined,
  rules: PaymentColorRule[]
): string | undefined => {
  if (!date || rules.length === 0) return undefined;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return undefined;

  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const daysLeft = Math.round(
    (startOfDay(target).getTime() - startOfDay(new Date()).getTime()) / 86400000
  );

  if (daysLeft < 0) return undefined;

  return rules
    .filter((rule) => Number.isFinite(rule.days) && daysLeft <= rule.days)
    .sort((a, b) => a.days - b.days)[0]?.color;
};
