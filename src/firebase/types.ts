export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: {
    route: string;
    [key: string]: string;
  };
}

export interface FCMTokenResponse {
  token: string | null;
  error?: string;
}