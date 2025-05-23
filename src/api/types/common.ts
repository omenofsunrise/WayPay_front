export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
}