import { useSyncExternalStore } from "react";

type InstallOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: InstallOutcome; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const isStandalone = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(display-mode: standalone)").matches;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => Boolean(deferredPrompt) && !isStandalone();
const getServerSnapshot = () => false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

const install = async (): Promise<InstallOutcome | "unavailable"> => {
  if (!deferredPrompt) return "unavailable";

  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();

  try {
    const result = await prompt.prompt();
    return result.outcome;
  } catch (error) {
    console.error("Не удалось открыть установку WayPay:", error);
    return "unavailable";
  }
};

export const usePwaInstall = () => ({
  canInstall: useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
  install,
});
