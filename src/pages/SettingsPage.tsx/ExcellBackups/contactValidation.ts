import type { Messenger } from "../../../api/types/excellBackup";

export type ContactValidator = (value: string) => string | null;

const stripNonDigits = (value: string) => value.replace(/\D/g, "");

// HTML5 email regexp (практически полностью покрывает реальные адреса)
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const validateTelegramId: ContactValidator = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "Укажите Telegram ID";
  if (!/^\d+$/.test(trimmed)) {
    return "Telegram ID — это число. Только цифры, без @, пробелов и букв";
  }
  if (trimmed.length < 5) return "Telegram ID слишком короткий — минимум 5 цифр";
  if (trimmed.length > 15) return "Telegram ID слишком длинный — максимум 15 цифр";
  if (trimmed.startsWith("0")) return "Telegram ID не может начинаться с 0";
  return null;
};

export const validateWhatsAppNumber: ContactValidator = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "Укажите номер WhatsApp";
  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return "Допустимы только цифры, пробелы, дефисы, скобки и знак +";
  }
  const digits = stripNonDigits(trimmed);
  if (digits.length < 10) {
    return "Слишком короткий номер — укажите код страны и номер (минимум 10 цифр)";
  }
  if (digits.length > 15) return "Слишком длинный номер — максимум 15 цифр";
  if (digits.startsWith("0")) {
    return "Номер не может начинаться с 0 — укажите код страны";
  }
  if (digits.length === 11 && digits.startsWith("8")) {
    return "Похоже на номер в национальном формате. Используйте международный, например: 79615081331";
  }
  return null;
};

export const validateEmail: ContactValidator = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "Укажите email";
  if (trimmed.length > 254) return "Email слишком длинный";
  if (/\s/.test(trimmed)) return "Email не должен содержать пробелов";
  if (!EMAIL_RE.test(trimmed)) {
    return "Введите корректный email, например: ch3rnow.c@yandex.ru";
  }
  return null;
};

export const validateContact: Record<Messenger, ContactValidator> = {
  Telegram: validateTelegramId,
  WhatsApp: validateWhatsAppNumber,
  Email: validateEmail,
};

// Нормализуем значение перед отправкой на бэк:
// WhatsApp — только цифры (без +, пробелов, скобок, дефисов),
// Email/Telegram — просто trim.
export const normalizeContact = (
  messenger: Messenger,
  value: string
): string => {
  const trimmed = value.trim();
  if (messenger === "WhatsApp") return stripNonDigits(trimmed);
  return trimmed;
};