// Сбор ФИО из Telegram-чатов в ЧС+ (бэкенд: /api/TelegramCollector).

export type CollectorAccountStatus =
  | "Disconnected"
  | "WaitingCode"
  | "WaitingPassword"
  | "Connected"
  | "SessionLost";

export type CollectorMarkAsRead = "Off" | "All" | "GroupsOnly";

export type CollectorPeerType = "User" | "Chat" | "Channel";

export type CandidateStatus = "Pending" | "Added" | "Rejected" | "Duplicate";

export type CandidateConfidence = "Low" | "Medium" | "High";

export type LoginStep = "Code" | "Password" | "Done";

export interface CollectorStatus {
  enabled: boolean;
  telegramConfigured: boolean;
  llmConfigured: boolean;
  llmModel: string;
  blacklistCreatorConfigured: boolean;
  queueLength: number;
  processedLastDay: number;
  failedLastDay: number;
  candidates: Record<CandidateStatus, number>;
}

export interface CollectorAccount {
  id: number;
  phone: string;
  status: CollectorAccountStatus;
  running: boolean;
  displayName: string | null;
  telegramUserId: number | null;
  readAllChats: boolean;
  markAsRead: CollectorMarkAsRead;
  autoAdd: boolean;
  lastError: string | null;
  connectedAt: string | null;
  chatsTotal: number;
  chatsEnabled: number;
}

export interface CollectorAccountSettings {
  readAllChats: boolean;
  markAsRead: CollectorMarkAsRead;
  autoAdd: boolean;
}

export interface CollectorChat {
  id: number;
  peerType: CollectorPeerType;
  peerId: number;
  title: string;
  enabled: boolean;
  lastMessageId: number;
}

export interface LoginResult {
  accountId: number;
  step: LoginStep;
}

export interface BlacklistCandidate {
  id: number;
  accountId: number;
  peerType: CollectorPeerType;
  peerId: number;
  chatTitle: string;
  messageId: number;
  messageDate: string;
  senderName: string | null;
  messageText: string;
  replyText: string | null;
  fullName: string;
  phone: string | null;
  birthdate: string | null;
  doc: string | null;
  address: string | null;
  comment: string | null;
  confidence: CandidateConfidence;
  status: CandidateStatus;
  duplicateOfId: number | null;
  duplicateReason: string | null;
  blacklistId: number | null;
  autoAdded: boolean;
  reviewedBy: number | null;
  reviewedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface CandidateUpdate {
  fullName: string;
  phone: string | null;
  birthdate: string | null;
  doc: string | null;
  address: string | null;
  comment: string | null;
}

export interface CandidateQuery {
  status?: CandidateStatus;
  accountId?: number;
  search?: string;
  page: number;
  pageSize: number;
}

export interface CandidatePage {
  items: BlacklistCandidate[];
  totalCount: number;
  page: number;
  pageSize: number;
}
