export interface Employee {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  role: string;
  permissions: string[] | null;
  minSurcharge: number,
  photoPath: string,
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