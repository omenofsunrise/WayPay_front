import React, { createContext, useContext, type ReactNode, useMemo, type JSX } from 'react';

interface PhoneUtilsContextValue {
  formatPhoneHref: (raw: string) => string;
  linkifyPhones: (text: string) => Array<string | JSX.Element>;
}

const PhoneUtilsContext = createContext<PhoneUtilsContextValue | null>(null);

const sanitizeDigits = (raw: string): string => raw.replace(/\D+/g, '');

export const normalizePhone = (raw: string): string => {
  const digits = sanitizeDigits(raw);
  if (!digits) return '';

  // Для РФ: 8XXXXXXXXXX или 7XXXXXXXXXX -> +7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }

  // 10 цифр без кода страны -> считаем РФ
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  // Прочие случаи: добавляем +
  return digits.startsWith('+') ? digits : `+${digits}`;
};

export const formatPhoneHref = (raw: string): string => {
  const normalized = normalizePhone(raw);
  return normalized ? `tel:${sanitizeDigits(normalized).replace(/^/, '+')}` : '';
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
  const value = useMemo<PhoneUtilsContextValue>(() => ({
    formatPhoneHref,
    linkifyPhones
  }), []);

  return (
    <PhoneUtilsContext.Provider value={value}>
      {children}
    </PhoneUtilsContext.Provider>
  );
};

export const usePhoneUtils = (): PhoneUtilsContextValue => {
  const ctx = useContext(PhoneUtilsContext);
  if (!ctx) {
    throw new Error('usePhoneUtils must be used within PhoneUtilsProvider');
  }
  return ctx;
};
