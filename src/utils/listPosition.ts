import { useEffect } from "react";

/**
 * Память места в бесконечном списке.
 *
 * Номер страницы там означает глубину подгрузки, а не место в выдаче, поэтому
 * одного его мало: вернувшись, человек должен увидеть ровно ту строку, на
 * которой остановился. Прокручивается само окно — значит достаточно запомнить
 * его смещение, строки в этих таблицах одной высоты.
 */

const read = (key: string): number => {
  try {
    const raw = localStorage.getItem(key);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const write = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* хранилище недоступно — работаем без памяти */
  }
};

/** Запоминает смещение окна, пока список открыт. */
export function useScrollMemory(key: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const onScroll = () => {
      // Пишем не чаще кадра: событие прокрутки летит десятками в секунду.
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        write(key, window.scrollY);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key, enabled]);
}

/**
 * Возвращает окно на запомненное место. Строки появляются не мгновенно,
 * поэтому ждём, пока страница дорастёт до нужной высоты, — но не бесконечно.
 */
export function restoreScroll(key: string, attempts = 30) {
  const target = read(key);
  if (!target) return;

  let left = attempts;
  const step = () => {
    const reachable =
      document.documentElement.scrollHeight - window.innerHeight;

    if (reachable >= target || left <= 0) {
      window.scrollTo({ top: Math.min(target, Math.max(reachable, 0)) });
      return;
    }

    left -= 1;
    window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

/** Забывает место — например, когда сменили фильтр. */
export function forgetScroll(key: string) {
  write(key, 0);
}
