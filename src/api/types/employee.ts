import { number } from "framer-motion";
import type { PaginationParams } from "./common";

export interface Permission {
  id: number;
  code: string;
  description: string;
}

/**
 * Кастомная роль. Ответ CRUD-эндпоинтов /Permission/custom-roles содержит `permissions`.
 * В составе сотрудника (GET /Employee, GET /Auth/info) поля могут быть урезаны —
 * для отображения используются только id/name, поэтому `permissions` опционально.
 */
export interface CustomRole {
  id: number;
  name: string;
  description: string;
  role: string;
  permissions?: Permission[];
}

/** Тело запроса создания/обновления кастомной роли. */
export interface CustomRolePayload {
  name: string;
  description: string;
  role: string;
  permissionCodes: string[];
}

export interface Employee {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  /** Второй номер для входа: вход работает с любого из двух. */
  secondPhone?: string | null;
  role: string;
  permissions: Permission[] | null;
  customRoleId?: number | null;
  customRole?: CustomRole | null;
  minSurcharge: number;
  photoPath: string;
  isBlocked: boolean;
  confirmedAmount: number;
  unconfirmedAmount: number;
}

/** Тело запроса смены роли сотрудника: одна из base-роли или кастомной роли. */
export interface UpdateEmployeeRolePayload {
  role?: string | null;
  customRoleId?: number | null;
}

export interface EmployeeFilterRequest extends PaginationParams {
  fullName?: string;
  role?: string;
  sortBy?: string;
}

export interface AuthInfoResponse {
  type: "employee";
  employee: Employee;
}

export interface CreditStats {
  year: number;
  month: number;
  count: number;
}

export interface PaymentStatsResponse {
  year: number;
  month: number;
  assumed: number;
  notAssumed: number;
  total: number;
}

export interface EmployeeExistsResponse {
  exists: boolean;
}

export interface EmployeeFullnames {
  id: number;
  fullName: string;
  photoPath: string;
}

export interface Profile {
  id: number;
  fullName: string;
  photoPath: string;
  description: string;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
}

export interface ProfileUpdateRequest {
  id?: number;
  description: string;
}
