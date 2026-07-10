export interface SendMediaRequest {
  to: string;
  mediaData?: string;
  fileName?: string;
  mediaKind?: string;
  caption?: string;
}

export interface SendMessageRequest {
  to: string;
  body?: string;
  mediaData?: string;
  fileName?: string;
  mediaKind?: string;
  caption?: string;

  isMedia?: boolean;
}

export interface SendMediaFormRequest {
  to: string;
  file: File;
  mediaKind: string;
  caption?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MarkAsReadRequest {
  messageId: string;
}

export interface DeleteMessageRequest {
  messageId: string;
}

export interface FindChatByPhoneRequest {
  clientPhone: string;
}

export interface FindChatByPhoneResponse {
  exists: boolean;
  chatId: string;
  clientName: string;
  clientPhone: string;
  lastMessage?: ChatMessage;
}

export interface GetChatWithClientRequest {
  clientPhone: string;
  limit?: number;
  offset?: number;
  channelId?: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  chatId?: string;
  clientPhone?: string;
  clientName?: string;
  totalCount: number;
  returnedCount: number;
  canLoadMore: boolean;
}

export interface InteractiveButton {
  type: string;
  title: string;
  id: string;
  copyCode: string;
  phoneNumber: string;
  url: string;
  merchantUrl: string;
}

export interface ImageContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  caption: string;
  preview: string;
  width: number;
  height: number;
  viewOnce: boolean;
  buttons: InteractiveButton[];
  data?: string;
}

export interface VideoContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  caption: string;
  preview: string;
  width: number;
  height: number;
  viewOnce: boolean;
  seconds: number;
  autoplay: boolean;
  buttons: InteractiveButton[];
  data?: string;
}

export interface DocumentContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  caption: string;
  preview: string;
  width: number;
  height: number;
  viewOnce: boolean;
  pageCount: number;
  buttons: InteractiveButton[];
  data?: string;
}

export interface AudioContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  seconds: number;
  recordingTime: number;
  waveform: string;
  viewOnce: boolean;
  data?: string;
}

export interface VoiceContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  seconds: number;
  recordingTime: number;
  waveform: string;
  viewOnce: boolean;
  data?: string;
}

export interface StickerContent {
  id: string;
  link: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  sha256: string;
  timestamp: number;
  animated: boolean;
  width: number;
  height: number;
  preview: string;
  viewOnce: boolean;
  data?: string;
}

export interface LocationContent {
  latitude: number;
  longitude: number;
  address: string;
  name: string;
  url: string;
  preview: string;
  accuracy: number;
  speed: number;
  degrees: number;
  comment: string;
  viewOnce: boolean;
}

export interface ContactContent {
  name: string;
  vcard: string;
}

export interface PollResult {
  id: string;
  name: string;
  count: number;
  voters: string[];
}

export interface PollContent {
  title: string;
  options: string[];
  voteLimit: number;
  total: number;
  results: PollResult[];
  viewOnce: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  groupKey: string;
  timestamp: number;
  unread: boolean;
  count: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  count: number;
}

// Основной тип сообщения
export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  chatId: string;
  chatName: string;
  fromName: string;
  timestamp: number;
  status:
    | "UNKNOWN"
    | "SENT"
    | "DELIVERED"
    | "READ"
    | "FAILED"
    | "DELETED"
    | "PENDING";
  isFromMe: boolean;
  source: string;
  deviceId: number;
  type: string;
  subtype: string;
  displayText: string;

  // Контент (один из них будет заполнен)
  text?: TextContent;
  image?: ImageContent;
  video?: VideoContent;
  audio?: AudioContent;
  voice?: VoiceContent;
  document?: DocumentContent;
  sticker?: StickerContent;
  location?: LocationContent;
  contact?: ContactContent;
  poll?: PollContent;

  // Дополнительно
  reactions: Reaction[];
  labels: Label[];
}

// Нужно добавить этот интерфейс, он используется в ChatMessage
export interface TextContent {
  body: string;
  buttons: InteractiveButton[];
  viewOnce: boolean;
}

export interface ChannelStatusResponse {
  phoneNumber: string;
  name: string;
  icon: string;
  connected: boolean;
  status?: string;
}

export interface QRResponse {
  qrString: string;
  status: "UNKNOWN" | "AWAITING_SCAN" | "CONNECTED" | "EXPIRED";
}

export interface ChannelResponse {
  activeTill?: string;
  creationTs?: string;
  id: string;
  stopped: boolean;
  blocked: boolean;
  name: string;
  employeeIds: number[];
  status: string; // 'connected' | 'disconnected'
  isCurrent: boolean;
  phone?: string;
}

export interface ChannelsResponse {
  chanelResponses: ChannelResponse[];
}

export interface CreateChannelRequest {
  name: string;
  employeeIds: number[];
}

export interface EmployeeListRequest {
  employeesList: number[];
}

export interface ExtendChannelRequest {
  days: number;
  channelId: string;
}

export type BotType = "Keywords" | "Events";

export const BotType = {
  Keywords: "Keywords",
  Events: "Events",
} as const;

// ComingPayment убран: сценарий «за N дней до платежа» теперь реализуется
// отдельной рассылкой типа Schedule (см. types/whatsappSender.ts).
export type BotEventType =
  | "CreatedCredit"
  | "CreatedPayment"
  | "ClientBirthdate";

export const BotEventType = {
  CreatedCredit: "CreatedCredit",
  CreatedPayment: "CreatedPayment",
  ClientBirthdate: "ClientBirthdate",
} as const;

export type BotResponseTextType = "WhatsAppBotNoClientResponse";

export const BotResponseTextType = {
  WhatsAppBotNoClientResponse: "WhatsAppBotNoClientResponse",
} as const;

export interface CreateBotRequest {
  channelId: string;
  name: string;
  botType: BotType;
}

export interface UpdateBotRequest {
  name: string;
  id: number;
  active: boolean;
}

export interface AddBotResponseRequest {
  botId: number;
  response: string;
  type?: BotResponseTextType;
}

export interface SetBotEventRequest {
  botId: number;
  eventType: BotEventType;
}

export interface AddBotKeywordRequest {
  botId: number;
  type: "Exact" | "Contains" | "StartsWith";
  keyword: string;
}

export interface BotKeywordResponse {
  id: number;
  botId: number;
  matchType: "Exact" | "Contains" | "StartsWith";
  keyword: string;
  createdAt?: string;
}

export interface DeleteBotKeywordRequest {
  id: number;
}

export interface BotListResponse {
  bots: BotResponse[];
}

export interface BotResponse {
  id: number;
  name: string;
  channelId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  keywords?: BotKeywordResponse[];
  botResponse?: string;
  botNoClientResponse?: string;
  botType: BotType;
  event?: BotEventType | null;
  eventDays?: number | null;
}

export interface GetBotsResponse {
  bots: BotResponse[];
}
