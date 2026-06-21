// Типы чёрного списка (BL+), соответствуют API /api/BlackList
// (см. swagger: test.waypay.one:5000/swagger).

/** Долг внутри записи чёрного списка. */
export interface BlacklistDebt {
  id: number;
  debtEndingAt: string | null;
  payed: boolean;
  creatorId: string | null;
  blacklistId: number;
}

/** Запись чёрного списка (BL+). */
export interface Blacklist {
  id: number;
  fullName: string;
  doc: string;
  docIssueDate: string | Date | null;
  phone: string;
  birthdate: string | Date | null;
  address: string;
  debtEndingAt: string | Date | null;
  isSwindler: boolean;
  creatorId: string | null;
  debts: BlacklistDebt[];

  // Легаси-поля, которые ещё читают старые экраны. Опциональны, чтобы не ломать сборку.
  document?: string;
  debt?: number;
}

/** Тело запроса для POST/PUT /BlackList. */
export interface BlacklistInput {
  fullName?: string;
  doc?: string;
  docIssueDate?: string | Date | null;
  phone?: string;
  birthdate?: string | Date | null;
  address?: string;
  isSwindler?: boolean;
  debtEndingAt?: string | Date | null;
}

/** Тело запроса для POST /BlackList/{id}/debts. */
export interface BlacklistDebtInput {
  debtEndingAt?: string | Date | null;
}

/** Уведомление чёрного списка. */
export interface BlacklistNotification {
  id: number;
  content: string;
  userId: string;
  blacklistId: number;
  read?: boolean;
  createdAt?: string;
}

/** Тело запроса для POST /BlackList/notifications. */
export interface BlacklistNotificationInput {
  content: string;
  userId: string;
  blacklistId: number;
}

/** Query-параметры GET /BlackList. */
export interface BlacklistParams {
  FullName?: string;
  Doc?: string;
  Phone?: string;
  Mine?: boolean;
  PageToken?: string;
  Id?: string;
  Page?: number;
  PageSize?: number;

  // Легаси-параметры старых экранов.
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
