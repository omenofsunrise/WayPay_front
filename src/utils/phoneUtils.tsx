import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  type JSX,
} from "react";

interface PhoneUtilsContextValue {
  formatPhoneHref: (raw: string) => string;
  linkifyPhones: (text: string) => Array<string | JSX.Element>;
}

const PhoneUtilsContext = createContext<PhoneUtilsContextValue | null>(null);

const sanitizeDigits = (raw: string): string => raw.replace(/\D+/g, "");

export const normalizePhone = (raw: string): string => {
  const digits = sanitizeDigits(raw);
  if (!digits) return "";

  // Для РФ: 8XXXXXXXXXX или 7XXXXXXXXXX -> +7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  // 10 цифр без кода страны -> считаем РФ
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  // Прочие случаи: добавляем +
  return digits.startsWith("+") ? digits : `+${digits}`;
};

// Приводит телефоноподобную строку к формату "8 (XXX) XXX-XX-XX",
// в котором номера хранятся в базе, чтобы общий поиск компаний находил
// по любому вводу (+7 928 476-98-86, 89284769886, 8 928 476 98 86 и т.д.).
// Не-телефонный ввод (название компании, короткий номер) не трогаем —
// поле поиска общее (номер / название / телефон).
export const formatPhoneForSearch = (raw: string): string => {
  const digits = sanitizeDigits(raw);
  // телефон РФ — это 10 или 11 цифр; иначе считаем, что это название/номер
  if (digits.length !== 10 && digits.length !== 11) return raw;

  // нормализуем к 11 цифрам с ведущей 8 (10 цифр -> 8XX…, 7XX… -> 8XX…)
  let d = digits;
  if (d.length === 10) d = `8${d}`;
  else if (d.startsWith("7")) d = `8${d.slice(1)}`;
  if (d.length !== 11) return raw;

  return `8 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(
    9,
    11
  )}`;
};

// «Умная» маска для ОБЩЕГО поля поиска (номер / название / телефон).
// Если ввод состоит только из цифр и телефонных символов (+, пробел,
// скобки, дефис) — форматируем как телефон "8 (XXX) XXзX-XX-XX" прямо при
// вводе. Как только появляется буква (поиск по названию) — не трогаем.
export const maskSearchPhone = (value: string): string => {
  if (!value) return value;
  // есть буквы или иные символы -> это название компании, не форматируем
  if (/[^\d\s()+\-]/.test(value)) return value;

  const digits = sanitizeDigits(value);
  if (!digits) return value; // одна пунктуация без цифр

  let d = digits.slice(0, 11);
  if (d.startsWith("7")) d = `8${d.slice(1)}`; // +7… / 7… -> 8…

  let out = "8";
  if (d.length > 1) out += ` (${d.slice(1, 4)}`;
  if (d.length > 4) out += `) ${d.slice(4, 7)}`;
  if (d.length > 7) out += `-${d.slice(7, 9)}`;
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
  return out;
};

export const formatPhoneHref = (raw: string): string => {
  const normalized = normalizePhone(raw);
  return normalized
    ? `tel:${sanitizeDigits(normalized).replace(/^/, "+")}`
    : "";
};

export const linkifyPhones = (text: string): Array<string | JSX.Element> => {
  const phoneRegex = /(\+?\d[\d\s().-]{8,}\d)/g;
  const parts = text.split(phoneRegex);

  return parts.map((part, idx) => {
    if (phoneRegex.test(part)) {
      const href = formatPhoneHref(part);
      if (!href) return part;
      return (
        <a key={`${part}-${idx}`} href={href}>
          {part.trim()}
        </a>
      );
    }
    return part;
  });
};

export const PhoneUtilsProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo<PhoneUtilsContextValue>(
    () => ({
      formatPhoneHref,
      linkifyPhones,
    }),
    []
  );

  return (
    <PhoneUtilsContext.Provider value={value}>
      {children}
    </PhoneUtilsContext.Provider>
  );
};

export const usePhoneUtils = (): PhoneUtilsContextValue => {
  const ctx = useContext(PhoneUtilsContext);
  if (!ctx) {
    throw new Error("usePhoneUtils must be used within PhoneUtilsProvider");
  }
  return ctx;
};
