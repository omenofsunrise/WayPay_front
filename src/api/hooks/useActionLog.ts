import { useCallback, useState } from "react";
import actionLogService from "../services/actionLogService";
import type {
  ActionLogDetails,
  ActionLogEntity,
  ActionLogFilters,
  ActionLogPage,
} from "../types/actionLog";

const useActionLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPage = useCallback(
    async (filters: ActionLogFilters): Promise<ActionLogPage | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await actionLogService.getPage(filters);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить журнал"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getEntities = useCallback(
    async (companyId?: number): Promise<ActionLogEntity[]> => {
      try {
        return await actionLogService.getEntities(companyId);
      } catch {
        return [];
      }
    },
    []
  );

  const getById = useCallback(
    async (id: number): Promise<ActionLogDetails | null> => {
      try {
        return await actionLogService.getById(id);
      } catch {
        return null;
      }
    },
    []
  );

  const getForEntity = useCallback(
    async (entity: string, entityId: string): Promise<ActionLogDetails[]> => {
      try {
        return await actionLogService.getForEntity(entity, entityId);
      } catch {
        return [];
      }
    },
    []
  );

  return { getPage, getEntities, getById, getForEntity, isLoading, error };
};

export default useActionLog;
