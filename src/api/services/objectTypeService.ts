import apiClient from '../client';
import type {
  ObjectType,
  ObjectTypeCreateRequest,
  ObjectTypeUpdateRequest,
  ObjectTypeFilters,
  PagedResult,
  ExistsResponse,
  EntityType,
} from '../types/objectType';

class ObjectTypeService {
  async create(objectTypeData: ObjectTypeCreateRequest): Promise<ObjectType> {
    const response = await apiClient.post<ObjectType>('/ObjectType', objectTypeData);
    return response.data;
  }

  async getAll(filters?: ObjectTypeFilters): Promise<PagedResult<ObjectType>> {
    const params = new URLSearchParams();
    
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }
    
    if (filters?.entityType) {
      params.append('entityType', filters.entityType.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/ObjectType?${queryString}` : '/ObjectType';

    const response = await apiClient.get<PagedResult<ObjectType>>(url);
    return response.data;
  }

  async update(id: number, updateData: ObjectTypeUpdateRequest): Promise<ObjectType> {
    const response = await apiClient.put<ObjectType>(`/ObjectType/${id}`, updateData);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/ObjectType/${id}`);
  }

  async exists(name: string, entityType: EntityType): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('entityType', entityType.toString());

    const response = await apiClient.get<ExistsResponse>(
      `/ObjectType/exists?${params.toString()}`
    );
    return response.data.exists;
  }
}

export default new ObjectTypeService();