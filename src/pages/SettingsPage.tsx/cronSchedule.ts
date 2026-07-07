// Человеко-читаемый конструктор расписания поверх 5-польного Unix-cron
// («минуты часы день-месяца месяц день-недели»). Пользователь выбирает
// частоту/время/день, а cron собирается тут. Если бэкенд окажется на Quartz —
// достаточно поправить buildCron/parseCron в одном месте.

export type Frequency = "daily" | "weekdays" | "weekly" | "monthly";

export interface ScheduleForm {
  frequency: Frequency;
  time: string; // "HH:MM"
  weekday: number; // Unix day-of-week: 0=Вс, 1=Пн … 6=Сб
  monthday: number; // 1–28
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: "Каждый день",
  weekdays: "По будням (Пн–Пт)",
  weekly: "Раз в неделю",
  monthly: "Раз в месяц",
};

// Пн первым, Вс последним — привычный порядок.
export const WEEKDAYS: { value: number; label: string; plural: string }[] = [
  { value: 1, label: "Понедельник", plural: "понедельникам" },
  { value: 2, label: "Вторник", plural: "вторникам" },
  { value: 3, label: "Среда", plural: "средам" },
  { value: 4, label: "Четверг", plural: "четвергам" },
  { value: 5, label: "Пятница", plural: "пятницам" },
  { value: 6, label: "Суббота", plural: "субботам" },
  { value: 0, label: "Воскресенье", plural: "воскресеньям" },
];

export const defaultSchedule: ScheduleForm = {
  frequency: "daily",
  time: "10:00",
  weekday: 1,
  monthday: 1,
};

const parseTime = (time: string): { h: number; m: number } => {
  const [hh, mm] = (time || "10:00").split(":");
  const h = Number(hh);
  const m = Number(mm);
  return {
    h: Number.isFinite(h) ? h : 10,
    m: Number.isFinite(m) ? m : 0,
  };
};

export function buildCron(form: ScheduleForm): string {
  const { h, m } = parseTime(form.time);
  switch (form.frequency) {
    case "daily":
      return `${m} ${h} * * *`;
    case "weekdays":
      return `${m} ${h} * * 1-5`;
    case "weekly":
      return `${m} ${h} * * ${form.weekday}`;
    case "monthly":
      return `${m} ${h} ${form.monthday} * *`;
  }
}

// Обратный разбор cron в форму. null — если шаблон не распознан
// (тогда показываем ручной режим).
export function parseCron(pattern: string): ScheduleForm | null {
  const parts = pattern.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m, h, dom, mon, dow] = parts;
  const isNum = (s: string) => /^\d+$/.test(s);
  if (mon !== "*" || !isNum(m) || !isNum(h)) return null;

  const time = `${String(Number(h)).padStart(2, "0")}:${String(
    Number(m)
  ).padStart(2, "0")}`;
  const base = { time, weekday: 1, monthday: 1 };

  if (dom === "*" && dow === "*") return { ...base, frequency: "daily" };
  if (dom === "*" && dow === "1-5") return { ...base, frequency: "weekdays" };
  if (dom === "*" && isNum(dow) && Number(dow) >= 0 && Number(dow) <= 6)
    return { ...base, frequency: "weekly", weekday: Number(dow) };
  if (isNum(dom) && dow === "*")
    return { ...base, frequency: "monthly", monthday: Number(dom) };

  return null;
}

export function describeSchedule(form: ScheduleForm): string {
  const t = form.time || "10:00";
  switch (form.frequency) {
    case "daily":
      return `Каждый день в ${t}`;
    case "weekdays":
      return `По будням (Пн–Пт) в ${t}`;
    case "weekly": {
      const day = WEEKDAYS.find((d) => d.value === form.weekday);
      return `По ${day?.plural ?? "понедельникам"} в ${t}`;
    }
    case "monthly":
      return `${form.monthday}-го числа каждого месяца в ${t}`;
  }
}

// Короткое описание для карточки по готовому cron (или сам cron, если не распознан).
export function describeCron(pattern: string): string {
  const form = parseCron(pattern);
  return form ? describeSchedule(form) : pattern;
}
