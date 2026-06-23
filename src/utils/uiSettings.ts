import { useEffect, useState } from "react";

export type CreditsDisplayMode = "pagination" | "list";

export interface UiSettings {
  creditsDisplayMode: CreditsDisplayMode;
  paymentsDisplayMode: CreditsDisplayMode;
}

const STORAGE_KEY = "uiSettings";
const SETTINGS_EVENT = "uiSettingsChanged";

const defaultSettings: UiSettings = {
  creditsDisplayMode: "pagination",
  paymentsDisplayMode: "pagination",
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
