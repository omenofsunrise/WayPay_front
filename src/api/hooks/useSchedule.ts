import { useState, useCallback } from 'react';
import scheduleService from '../services/scheduleService';
import type { 
    ScheduleItem, 
    ScheduleDetails, 
    ScheduleParams, 
    SchedulePreviewParams 
} from '../types/schedule';
import type { PaginatedResponse } from '../types/common';

const useSchedule = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scheduleData, setScheduleData] = useState<PaginatedResponse<ScheduleDetails> | null>(null);
    const [scheduleDetails, setScheduleDetails] = useState<ScheduleDetails | null>(null);
    const [previewData, setPreviewData] = useState<ScheduleItem[] | null>(null);

    const getList = useCallback(async (
        params?: ScheduleParams
    ): Promise<PaginatedResponse<ScheduleDetails> | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await scheduleService.getList(params);
            setScheduleData(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getByCreditId = useCallback(async (
        creditId: number, 
        params?: Omit<ScheduleParams, 'creditId'>
    ): Promise<PaginatedResponse<ScheduleDetails> | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await scheduleService.getByCreditId(creditId, params);
            setScheduleData(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getById = useCallback(async (id: number): Promise<ScheduleDetails | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await scheduleService.getById(id);
            setScheduleDetails(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getPreview = useCallback(async (
        params: SchedulePreviewParams
    ): Promise<ScheduleItem[] | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await scheduleService.getPreview(params);
            setPreviewData(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get schedule preview');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        scheduleData,
        scheduleDetails,
        previewData,
        getList,
        getByCreditId,
        getById,
        getPreview,
    };
};

export default useSchedule;