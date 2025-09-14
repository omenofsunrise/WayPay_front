import { useState, useCallback } from 'react';
import objectTypeService from '../services/objectTypeService';
import type {
  ObjectType,
  ObjectTypeCreateRequest,
  ObjectTypeUpdateRequest,
  ObjectTypeFilters,
  PagedResult,
  EntityType
} from '../types/objectType';

const useObjectTypes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [pagedResult, setPagedResult] = useState<PagedResult<ObjectType> | null>(null);

  const getAll = useCallback(async (filters?: ObjectTypeFilters): Promise<PagedResult<ObjectType> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await objectTypeService.getAll(filters);
      setObjectTypes(result.items);
      setPagedResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (objectTypeData: ObjectTypeCreateRequest): Promise<ObjectType | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await objectTypeService.create(objectTypeData);
      setObjectTypes(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, updateData: ObjectTypeUpdateRequest): Promise<ObjectType | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await objectTypeService.update(id, updateData);
      setObjectTypes(prev => prev.map(ot => ot.id === id ? result : ot));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteObjectType = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await objectTypeService.delete(id);
      setObjectTypes(prev => prev.filter(ot => ot.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exists = useCallback(async (name: string, entityType: EntityType): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      return await objectTypeService.exists(name, entityType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    objectTypes,
    pagedResult,
    getAll,
    create,
    update,
    deleteObjectType,
    exists,
    clearError: () => setError(null),
    clearObjectTypes: () => {
      setObjectTypes([]);
      setPagedResult(null);
    },
  };
};

export default useObjectTypes;