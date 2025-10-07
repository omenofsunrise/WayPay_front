export type Permission = 
  | 'CREATE_CREDITS'
  | 'DELETE_CREDITS'
  | 'VIEW_CREDITS'
  | 'VIEW_ANALYTIC'
  | 'VIEW_ALL_CREDITS'
;

export type Role = 'админ' | 'сотрудник' | 'директор' | 'суперадмин' | 'бухгалтер';

export interface AuthInfo {
  type: 'employee';
  hasPin: boolean;
  employee: {
    id: number;
    fullName: string;
    role: Role;
    permissions: Permission[];
    minSurcharge: number;
    companyId: number;
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