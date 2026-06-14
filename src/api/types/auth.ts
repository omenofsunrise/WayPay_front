export type Permission =
  | "CREATE_CREDITS"
  | "DELETE_CREDITS"
  | "EDIT_CREDITS"
  | "VIEW_CREDITS"
  | "VIEW_ANALYTIC"
  | "VIEW_ALL_CREDITS"
  | "FORBID_CREATING_CREDITS"
  | "FORBID_CREATING_PAYMENTS"
  | "FORBID_DELETING_PAYMENTS"
  | "FORBID_CREDIT_APPLICATIONS"
  | "MANAGE_ACCOUNTING";

export type Role =
  | "админ"
  | "сотрудник"
  | "директор"
  | "суперадмин";

export type UserType = "employee" | "payment_place";

/** Кастомная роль в составе auth-инфо (GET /Auth/info). */
export interface AuthCustomRole {
  id: number;
  name: string;
  description: string;
  role: string;
}

export interface AuthInfo {
  type: UserType;
  hasPin: boolean;
  employee: {
    id: number;
    fullName: string;
    role: Role;
    permissions: Permission[];
    customRoleId?: number | null;
    customRole?: AuthCustomRole | null;
    phone?: string;
    minSurcharge: number;
    companyId: number;
    licenceExpire?: Date;
    licenceActive?: boolean;
    paymentUrl?: string;
    status?: string;
    transactionStatus?: string;
  };
}

export interface AuthSession {
  id: number;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string;
  deviceInfo: string;
  isMobile: boolean;
  hasPin: boolean;
  isCurrentSession: boolean;
  pinLocked: boolean;
  pinLockedUntil: string | null;
}
