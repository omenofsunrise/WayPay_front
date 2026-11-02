// Рассылка (WhatsAppSender) — самостоятельная сущность. Связь много-к-одному:
// к одной рассылке может относиться много ботов (см. PATCH /WhatsAppSender/{id}).
//
// Тип рассылки на бэкенде сейчас один — Schedule: рассылка по расписанию
// (cron `pattern`), `eventDays` = за сколько дней до платежа слать
// (заменяет прежний бот-ивент ComingPayment). Событийные сценарии
// (CreatedCredit/CreatedPayment/ClientBirthdate) задаются не здесь, а на ботах.
export type WhatsAppSenderType = "Schedule";

export const WhatsAppSenderType = {
  Schedule: "Schedule",
} as const;

// Тело POST /api/WhatsAppSender и PUT /api/WhatsAppSender/{senderId}
export interface UpsertWhatsAppSenderRequest {
  type: WhatsAppSenderType;
  eventDays: number;
  pattern: string;
}

// Элемент GET /api/WhatsAppSender
export interface WhatsAppSender {
  id: number;
  type: WhatsAppSenderType;
  eventDays: number;
  pattern: string;
  bots?: WhatsAppSenderBot[];
}

export interface WhatsAppSenderBot {
  id: number;
  isActive: boolean;
  name: string;
}

// PATCH /api/WhatsAppSender/{senderId} принимает массив id ботов: number[]

// === Отчёты ===

export interface SenderReportLog {
  id: number;
  scheduleId: number;
  creditId: number;
  clientId: number;
  clientName: string;
  paymentAmount: number;
  paymentDate: string;
  daysBeforePayment: number;
  isSuccess: boolean;
  errorMessage?: string | null;
  messageId?: string | null;
  sentAt: string;
  channelBotId: number;
  botName: string;
}

export interface SenderReportSummary {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
}

export interface SenderReportSenderGroup {
  senderId: number;
  senderType: string;
  eventDays: number;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  logs: SenderReportLog[];
}

export interface SenderReportRecentFailure {
  scheduleId: number;
  clientName: string;
  paymentAmount: number;
  errorMessage?: string | null;
  sentAt: string;
}

export interface SenderReportStatistics {
  totalSenders: number;
  totalBotsUsed: number;
  firstAttempt: string;
  lastAttempt: string;
  paymentsByDays: Record<string, number>;
  errorsByType: Record<string, number>;
}

// GET /api/WhatsAppSender/report
export interface SenderReport {
  reportDate: string;
  summary: SenderReportSummary;
  senders: SenderReportSenderGroup[];
  recentFailures: SenderReportRecentFailure[];
  statistics: SenderReportStatistics;
}

// GET /api/WhatsAppSender/report/details
export interface SenderReportDetails {
  reportDate: string;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: SenderReportLog[];
}

export interface SenderReportDetailsParams {
  date?: string;
  isSuccess?: boolean;
  page?: number;
  pageSize?: number;
}
