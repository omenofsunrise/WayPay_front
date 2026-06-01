import { useState, useCallback } from "react";
import scheduleService from "../services/scheduleService";
import type {
  ScheduleItem,
  ScheduleDetails,
  ScheduleParams,
  SchedulePreviewParams,
  ScheduleCalendarParams,
  CalendarResult,
  CalendarSummary,
  UpdateScheduleRequest,
} from "../types/schedule";
import type { PaginatedResponse } from "../types/common";

const EMPTY_CALENDAR_SUMMARY: CalendarSummary = {
  totalCount: 0,
  totalOverdues: 0,
  overduesAmount: 0,
};

const useSchedule = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] =
    useState<PaginatedResponse<ScheduleDetails> | null>(null);
  const [calendarData, setCalendarData] = useState<ScheduleDetails[]>([]);
  const [calendarSummary, setCalendarSummary] = useState<CalendarSummary>(
    EMPTY_CALENDAR_SUMMARY
  );
  const [scheduleDetails, setScheduleDetails] =
    useState<ScheduleDetails | null>(null);
  const [previewData, setPreviewData] = useState<ScheduleItem[] | null>(null);

  const getList = useCallback(
    async (
      params?: ScheduleParams
    ): Promise<PaginatedResponse<ScheduleDetails> | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await scheduleService.getList(params);
        setScheduleData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getByCreditId = useCallback(
    async (
      creditId: number,
      params?: Omit<ScheduleParams, "creditId">
    ): Promise<PaginatedResponse<ScheduleDetails> | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await scheduleService.getByCreditId(creditId, params);
        setScheduleData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getById = useCallback(
    async (id: number): Promise<ScheduleDetails | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await scheduleService.getById(id);
        setScheduleDetails(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getCalendar = useCallback(
    async (params?: ScheduleCalendarParams): Promise<CalendarResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await scheduleService.getCalendar(params);
        setCalendarData(result.items);
        setCalendarSummary({
          totalCount: result.totalCount,
          totalOverdues: result.totalOverdues,
          overduesAmount: result.overduesAmount,
        });
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get schedule calendar"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPreview = useCallback(
    async (params: SchedulePreviewParams): Promise<ScheduleItem[] | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await scheduleService.getPreview(params);
        setPreviewData(result);
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get schedule preview"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const markAsNotified = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await scheduleService.markAsNotified(id);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark schedule as notified"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDate = useCallback(
    async (id: number, date: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await scheduleService.updateDate(id, date);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update schedule date"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateSchedule = useCallback(
    async (request: UpdateScheduleRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await scheduleService.updateSchedule(request);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update schedule"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateDates = useCallback(
    async (ids: number[], date: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all(
          ids.map((id) => scheduleService.updateDate(id, date))
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update schedule dates"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    scheduleData,
    calendarData,
    calendarSummary,
    scheduleDetails,
    previewData,
    getList,
    getByCreditId,
    getById,
    getCalendar,
    getPreview,
    markAsNotified,
    updateSchedule,
    updateDate,
    updateDates,
  };
};

export default useSchedule;
