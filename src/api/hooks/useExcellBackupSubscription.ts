import { useCallback, useState } from "react";
import api from "../client";
import { extractErrorMessage } from "../utils/errorMessage";
import type {
  ExcellBackupSubscription,
  ExcellBackupSubscriptionPayload,
} from "../types/excellBackup";

const BASE = "/excell-backup/subscriptions";

const useExcellBackupSubscription = () => {
  const [subscriptions, setSubscriptions] = useState<ExcellBackupSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ExcellBackupSubscription[]>(BASE);
      setSubscriptions(data ?? []);
      return data;
    } catch (e) {
      setError(extractErrorMessage(e, "Не удалось загрузить подписки"));
      setSubscriptions([]);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = async (payload: ExcellBackupSubscriptionPayload) => {
    setSaving(true);
    try {
      const { data } = await api.post<ExcellBackupSubscription>(BASE, payload);
      setSubscriptions((prev) => [...prev, data]);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const updateSubscription = async (
    id: number,
    payload: Partial<ExcellBackupSubscriptionPayload>
  ) => {
    setSaving(true);
    try {
      const { data } = await api.patch<ExcellBackupSubscription>(
        `${BASE}/${id}`,
        payload
      );
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? data : s)));
      return data;
    } finally {
      setSaving(false);
    }
  };

  const addItem = async (id: number, item: "Credits" | "Clients") => {
    const { data } = await api.post<ExcellBackupSubscription>(
      `${BASE}/${id}/items/${item}`
    );
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  const removeItem = async (id: number, item: "Credits" | "Clients") => {
    const { data } = await api.delete<ExcellBackupSubscription>(
      `${BASE}/${id}/items/${item}`
    );
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  const deleteSubscription = async (id: number) => {
    await api.delete(`${BASE}/${id}`);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    subscriptions,
    loading,
    error,
    saving,
    fetchAll,
    createSubscription,
    updateSubscription,
    addItem,
    removeItem,
    deleteSubscription,
  };
};

export default useExcellBackupSubscription;