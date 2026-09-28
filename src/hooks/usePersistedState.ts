import { useEffect, useState } from "react";

/**
 * useState, который переживает уход со страницы.
 *
 * Нужен фильтрам: при переключении разделов страница размонтируется, обычный
 * useState обнуляется, и набранные фильтры приходится вводить заново.
 *
 * Значение лежит в localStorage — так же, как фильтры договоров в CreditPage.
 * Любая ошибка хранилища (приватный режим, переполнение квоты) проглатывается:
 * несохранённый фильтр — неудобство, упавшая страница — поломка.
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* хранилище недоступно — работаем без сохранения */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export default usePersistedState;
