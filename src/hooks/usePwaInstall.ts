import { useSyncExternalStore } from "react";

type InstallOutcome = "accepted" | "dismissed";
type InstallAvailability = "installed" | "installable" | "manual";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: InstallOutcome; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const isStandalone = () => {
  if (typeof window === "undefined") return false;

  const safariNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    safariNavigator.standalone === true
  );
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): InstallAvailability => {
  if (isStandalone()) return "installed";
  return deferredPrompt ? "installable" : "manual";
};
const getServerSnapshot = (): InstallAvailability => "manual";

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

export const usePwaInstall = () => {
  const availability = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    canInstall: availability === "installable",
    isInstalled: availability === "installed",
    install,
  };
};
