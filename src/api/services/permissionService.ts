import apiClient from "../client";
import type { CustomRole, CustomRolePayload } from "../types/employee";

/**
 * Сервис управления кастомными ролями (/api/Permission/custom-roles).
 *
 * GET поддерживает query-параметр `includePermissions` (по умолчанию false):
 * с true возвращает каждую роль вместе со списком её прав.
 */
class PermissionService {
  static async getCustomRoles(
    includePermissions = false
  ): Promise<CustomRole[]> {
    const response = await apiClient.get("/Permission/custom-roles", {
      params: { includePermissions },
    });
    return response.data;
  }

  static async createCustomRole(
    payload: CustomRolePayload
  ): Promise<CustomRole> {
    const response = await apiClient.post("/Permission/custom-roles", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }

  static async updateCustomRole(
    id: number,
    payload: CustomRolePayload
  ): Promise<CustomRole> {
    const response = await apiClient.put(
      `/Permission/custom-roles/${id}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  }

  static async deleteCustomRole(id: number): Promise<void> {
    await apiClient.delete(`/Permission/custom-roles/${id}`);
  }
}

export default PermissionService;
