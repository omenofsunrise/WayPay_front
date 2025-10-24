export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationType = {
    AllUsers: 1,
    Clients: 2,
    Employees: 3,
    Single: 4,
} as const;

export interface SendNotificationRequest {
    type: NotificationType;
    title: string;
    message: string;
    employeeId?: number | null;
    clientId?: number | null;
    deviceToken?: string | null;
    avatarPath?: string | null;
}

export interface NotificationResponse {
    id: number;
    title: string;
    message: string;
    senderAvatarPath: string;
    dateTime: Date;
}