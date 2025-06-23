import type { PaginationParams } from './common';

export interface Permission {
  id: number;
  code: string;
  description: string;
}

export interface Employee {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  role: string;
  permissions: Permission[] | null;
  minSurcharge: number;
  photoPath: string;
}

export interface EmployeeFilterRequest extends PaginationParams{
  fullName?: string;
  role?: string;
  sortBy?: string;
}

export interface AuthInfoResponse {
  type: 'employee';
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
}