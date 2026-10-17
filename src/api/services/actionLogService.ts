import apiClient from "../client";
import type {
  ActionLogDetails,
  ActionLogEntity,
  ActionLogFilters,
  ActionLogPage,
} from "../types/actionLog";

class ActionLogService {
  async getPage(filters: ActionLogFilters): Promise<ActionLogPage> {
    const response = await apiClient.get("/ActionLog", { params: filters });
    return response.data;
  }

  async getEntities(companyId?: number): Promise<ActionLogEntity[]> {
    const response = await apiClient.get("/ActionLog/entities", {
      params: companyId ? { companyId } : undefined,
    });
    return response.data;
  }

  async getById(id: number): Promise<ActionLogDetails> {
    const response = await apiClient.get(`/ActionLog/${id}`);
    return response.data;
  }
}

export default new ActionLogService();
