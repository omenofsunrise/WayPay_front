import type { PaginationParams } from './common';

export interface Product {
  id: number;
  name: string;
  companyId: number;
  employeeId: number;
}

export interface ProductParams extends PaginationParams {
  name?: string;
}