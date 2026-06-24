// Пометки о клиенте по итогам последнего платежа.
// Значения — строковые имена enum FeedbackMark на бэкенде
// (Good=1, Difficult=2, Conscientious=3, Problematic=4,
//  Regular=5, VIP=6, LatePayer=7, Reliable=8).
export type FeedbackMark =
  | "Good"
  | "Difficult"
  | "Conscientious"
  | "Problematic"
  | "Regular"
  | "VIP"
  | "LatePayer"
  | "Reliable";

// Числовые значения enum на бэкенде (для тела запроса).
export const FEEDBACK_MARK_VALUE: Record<FeedbackMark, number> = {
  Good: 1,
  Difficult: 2,
  Conscientious: 3,
  Problematic: 4,
  Regular: 5,
  VIP: 6,
  LatePayer: 7,
  Reliable: 8,
};

export interface FeedbackMarkOption {
  value: FeedbackMark;
  label: string;
  positive: boolean;
}

// Подписи для кнопок-чипов в окне отзыва.
export const FEEDBACK_MARK_OPTIONS: FeedbackMarkOption[] = [
  { value: "Good", label: "Хороший клиент", positive: true },
  { value: "Conscientious", label: "Добросовестный", positive: true },
  { value: "Reliable", label: "Надёжный", positive: true },
  { value: "VIP", label: "VIP", positive: true },
  { value: "Regular", label: "Постоянный", positive: true },
  { value: "Difficult", label: "Трудный клиент", positive: false },
  { value: "LatePayer", label: "Платит с задержкой", positive: false },
  { value: "Problematic", label: "Проблемный", positive: false },
];

export interface CreateClientFeedbackRequest {
  clientId: number;
  mark: FeedbackMark;
  stars?: number;
  comment?: string;
}
