import apiClient from "../client";
import type {
  ScheduleItem,
  ScheduleDetails,
  ScheduleParams,
  SchedulePreviewParams,
  ScheduleCalendarParams,
  CalendarResult,
  UpdateScheduleRequest,
} from "../types/schedule";
import type { PaginatedResponse } from "../types/common";

type CalendarResponse =
  | ScheduleDetails[]
  | PaginatedResponse<ScheduleDetails>
  | Record<string, unknown>;

const getValue = <T>(
  source: Record<string, unknown>,
  ...keys: string[]
): T | undefined => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key] as T;
    }
  }
  return undefined;
};

const getArrayValue = (
  source: Record<string, unknown>,
  ...keys: string[]
): unknown[] | undefined => {
  const value = getValue<unknown>(source, ...keys);
  return Array.isArray(value) ? value : undefined;
};

const getNumberValue = (
  source: Record<string, unknown>,
  ...keys: string[]
): number => {
  const value = getValue<number | string>(source, ...keys);
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : 0;
};

const unwrapCalendarItems = (data: CalendarResponse): unknown[] => {
  if (Array.isArray(data)) {
    return data;
  }

  const wrappedItems = getArrayValue(
    data,
    "items",
    "Items",
    "data",
    "Data",
    "result",
    "Result",
    "rows",
    "Rows",
    "clients",
    "Clients",
    "schedules",
    "Schedules",
    "payments",
    "Payments"
  );
  return wrappedItems ?? [];
};

const normalizeScheduleDetails = (
  rawItem: unknown,
  parentContext?: Record<string, unknown>
): ScheduleDetails | null => {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const item = rawItem as Record<string, unknown>;
  const context = parentContext ?? {};

  return {
    id: getValue<number>(item, "id", "Id") ?? 0,
    creditId: getValue<number>(item, "creditId", "CreditId") ?? 0,
    rest: getValue<number>(item, "rest", "Rest") ?? 0,
    paymentDate:
      getValue<Date>(item, "paymentDate", "PaymentDate", "date", "Date") ??
      new Date(""),
    paymentAmount:
      getValue<number>(
        item,
        "paymentAmount",
        "PaymentAmount",
        "amount",
        "Amount"
      ) ?? 0,
    clientName:
      getValue<string>(
        item,
        "clientName",
        "ClientName",
        "clientFullName",
        "ClientFullName"
      ) ??
      getValue<string>(
        context,
        "clientName",
        "ClientName",
        "clientFullName",
        "ClientFullName"
      ) ??
      "",
    comment: getValue<string>(item, "comment", "Comment") ?? "",
    notified: getValue<boolean>(item, "notified", "Notified") ?? false,
    isPaid: getValue<boolean>(item, "isPaid", "IsPaid"),
    paidDate: getValue<Date>(item, "paidDate", "PaidDate"),
    clientPhone:
      getValue<string>(item, "clientPhone", "ClientPhone") ??
      getValue<string>(context, "clientPhone", "ClientPhone") ??
      "",
    guarantorFullname:
      getValue<string>(
        item,
        "guarantorFullname",
        "GuarantorFullname",
        "guarantorFullName",
        "GuarantorFullName"
      ) ??
      getValue<string>(
        context,
        "guarantorFullname",
        "GuarantorFullname",
        "guarantorFullName",
        "GuarantorFullName"
      ),
    guarantorPhone:
      getValue<string>(item, "guarantorPhone", "GuarantorPhone") ??
      getValue<string>(context, "guarantorPhone", "GuarantorPhone"),
    payed: getValue<boolean>(item, "payed", "Payed"),
    userComment:
      getValue<string | null>(item, "userComment", "UserComment") ?? null,
    status: getValue<ScheduleDetails["status"]>(item, "status", "Status"),
  };
};

const normalizeCalendarResponse = (
  data: CalendarResponse
): ScheduleDetails[] => {
  return unwrapCalendarItems(data).flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const itemObject = item as Record<string, unknown>;
    const nestedItems = getArrayValue(
      itemObject,
      "payments",
      "Payments",
      "items",
      "Items",
      "schedules",
      "Schedules",
      "calendar",
      "Calendar"
    );

    if (nestedItems) {
      return nestedItems
        .map((nestedItem) => normalizeScheduleDetails(nestedItem, itemObject))
        .filter((schedule): schedule is ScheduleDetails => Boolean(schedule));
    }

    const normalizedItem = normalizeScheduleDetails(itemObject);
    return normalizedItem ? [normalizedItem] : [];
  });
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Максимальный диапазон дат для одного запроса /Schedule/calendar (ограничение бэкенда).
const CALENDAR_MAX_RANGE_DAYS = 120;
// Предохранитель, чтобы очень широкий диапазон не превратился в сотни запросов.
const CALENDAR_MAX_CHUNKS = 60;
// Сколько окон грузим одновременно, чтобы не перегружать сервер.
const CALENDAR_CHUNK_CONCURRENCY = 4;

const getDaysBetweenDates = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
};

const buildDateChunks = (
  start: Date,
  end: Date
): { start: Date; end: Date }[] => {
  const chunks: { start: Date; end: Date }[] = [];
  let cursor = new Date(start);

  while (cursor <= end && chunks.length < CALENDAR_MAX_CHUNKS) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setDate(chunkEnd.getDate() + CALENDAR_MAX_RANGE_DAYS - 1);

    chunks.push({
      start: new Date(cursor),
      end: chunkEnd > end ? new Date(end) : chunkEnd,
    });

    cursor = new Date(chunkEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return chunks;
};

class ScheduleService {
  async getList(
    params?: ScheduleParams
  ): Promise<PaginatedResponse<ScheduleDetails>> {
    const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
      "/Schedule",
      { params }
    );
    return response.data;
  }

  async getByCreditId(
    creditId: number,
    params?: Omit<ScheduleParams, "creditId">
  ): Promise<PaginatedResponse<ScheduleDetails>> {
    const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
      `/Schedule/by-credit/${creditId}`,
      { params }
    );
    return response.data;
  }

  async getById(id: number): Promise<ScheduleDetails> {
    const response = await apiClient.get<ScheduleDetails>(`/Schedule/${id}`);
    return response.data;
  }

  private async fetchCalendarChunk(
    params?: ScheduleCalendarParams
  ): Promise<CalendarResult> {
    const response = await apiClient.get<CalendarResponse>(
      "/Schedule/calendar",
      { params }
    );
    const data = response.data;
    const summarySource =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    return {
      items: normalizeCalendarResponse(data),
      totalCount: getNumberValue(summarySource, "totalCount", "TotalCount"),
      totalOverdues: getNumberValue(
        summarySource,
        "totalOverdues",
        "TotalOverdues"
      ),
      overduesAmount: getNumberValue(
        summarySource,
        "overduesAmount",
        "OverduesAmount"
      ),
    };
  }

  async getCalendar(params?: ScheduleCalendarParams): Promise<CalendarResult> {
    const start = params?.StartDate ? new Date(params.StartDate) : null;
    const end = params?.EndDate ? new Date(params.EndDate) : null;

    // Бэкенд ограничивает диапазон одного запроса (CALENDAR_MAX_RANGE_DAYS дней)
    // и отвечает 400 на более широкий период. Чтобы можно было смотреть и прошлые
    // годы, разбиваем диапазон на окна и склеиваем результат на фронте.
    if (
      start &&
      end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      getDaysBetweenDates(start, end) > CALENDAR_MAX_RANGE_DAYS
    ) {
      const chunks = buildDateChunks(start, end);

      // Грузим окна батчами с ограниченной одновременностью, чтобы не перегружать сервер.
      const results: CalendarResult[] = [];
      for (let i = 0; i < chunks.length; i += CALENDAR_CHUNK_CONCURRENCY) {
        const batch = chunks.slice(i, i + CALENDAR_CHUNK_CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map((chunk) =>
            this.fetchCalendarChunk({
              ...params,
              StartDate: chunk.start,
              EndDate: chunk.end,
            })
          )
        );
        results.push(...batchResults);
      }

      const itemsById = new Map<number, ScheduleDetails>();
      let totalCount = 0;
      let totalOverdues = 0;
      let overduesAmount = 0;

      for (const result of results) {
        result.items.forEach((item) => itemsById.set(item.id, item));
        totalCount += result.totalCount;
        totalOverdues += result.totalOverdues;
        overduesAmount += result.overduesAmount;
      }

      return {
        items: Array.from(itemsById.values()),
        totalCount,
        totalOverdues,
        overduesAmount,
      };
    }

    return this.fetchCalendarChunk(params);
  }

  async markAsNotified(id: number): Promise<void> {
    await apiClient.put(`/Schedule/${id}`);
  }

  async updateDate(id: number, date: string): Promise<void> {
    await apiClient.put("/Schedule", { id, date });
  }

  async updateSchedule(request: UpdateScheduleRequest): Promise<void> {
    await apiClient.put("/Schedule", request);
  }

  async getPreview(params: SchedulePreviewParams): Promise<ScheduleItem[]> {
    const response = await apiClient.post<ScheduleItem[]>(
      "/Schedule/preview",
      params
    );
    return response.data;
  }
}

export default new ScheduleService();
