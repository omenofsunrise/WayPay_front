export interface Employee {
  id: number;
  fio: string;
  address: string;
  phone: string;
  role: string;
  permissions: string[] | null;
}

export interface AuthInfoResponse {
  type: 'employee';
  employee: Employee;
}