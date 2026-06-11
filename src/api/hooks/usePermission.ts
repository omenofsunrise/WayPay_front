import { useState, useCallback } from "react";
import PermissionService from "../services/permissionService";
import type { CustomRole, CustomRolePayload } from "../types/employee";

export function usePermission() {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchCustomRoles = useCallback(async (includePermissions = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await PermissionService.getCustomRoles(includePermissions);
      setCustomRoles(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomRole = useCallback(async (payload: CustomRolePayload) => {
    try {
      setSaving(true);
      setError(null);
      const created = await PermissionService.createCustomRole(payload);
      setCustomRoles((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCustomRole = useCallback(
    async (id: number, payload: CustomRolePayload) => {
      try {
        setSaving(true);
        setError(null);
        const updated = await PermissionService.updateCustomRole(id, payload);
        setCustomRoles((prev) => prev.map((r) => (r.id === id ? updated : r)));
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const deleteCustomRole = useCallback(async (id: number) => {
    try {
      setSaving(true);
      setError(null);
      await PermissionService.deleteCustomRole(id);
      setCustomRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    customRoles,
    loading,
    error,
    saving,
    fetchCustomRoles,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
  };
}
