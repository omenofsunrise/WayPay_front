export interface Employee {
  id: number;
  fio: string;
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