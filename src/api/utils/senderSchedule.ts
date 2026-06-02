import { DateDirection } from "../types/sender";
import type {
  CreateSenderSetting,
  SenderSettingResponse,
} from "../types/sender";

export type ScheduleType = "upcoming" | "onDay" | "overdue";

/** Преобразует выбор пользователя в формат API (days + direction). */
export const buildSenderSetting = (
  type: ScheduleType,
  days: number
): CreateSenderSetting => {
  switch (type) {
    case "upcoming":
      return { days, direction: DateDirection.Before };
    case "onDay":
      return { days: 0, direction: DateDirection.Before };
    case "overdue":
      return { days, direction: DateDirection.After };
  }
};

/** Человекочитаемое описание настройки рассылки для списка. */
export const describeSenderSetting = (
  setting: Pick<SenderSettingResponse, "days" | "direction">
): string => {
  if (setting.days === 0) return "В день платежа";
  if (setting.direction === DateDirection.After) {
    return `Через ${setting.days} дн. после платежа (просрочка)`;
  }
  return `За ${setting.days} дн. до платежа`;
};

/** Уже есть точно такая же рассылка? */
export const isDuplicateSetting = (
  existing: SenderSettingResponse[],
  setting: CreateSenderSetting
): boolean => {
  if (setting.days === 0) {
    return existing.some((s) => s.days === 0);
  }
  return existing.some(
    (s) => s.days === setting.days && s.direction === setting.direction
  );
};
