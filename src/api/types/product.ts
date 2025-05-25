import type { PaginationParams } from './common';

export interface Product {
  id: number;
  name: string;
}

export interface ProductParams extends PaginationParams {
  name?: string;
  sortBy?: string;
  descending?: boolean;
}