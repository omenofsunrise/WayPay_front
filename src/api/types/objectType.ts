export type EntityType = 'credit';

export const ENTITY_TYPES = {
  CREDIT: 'credit' as EntityType,
};

export interface ObjectType {
  id: number;
  name: string;
  entityType: EntityType;
}

export interface ObjectTypeCreateRequest {
  name: string;
  entityType: EntityType;
}

export interface ObjectTypeUpdateRequest {
  name: string;
}

export interface ObjectTypeFilters {
  entityType?: EntityType;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExistsResponse {
  exists: boolean;
}