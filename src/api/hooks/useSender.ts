import { useState, useCallback } from 'react';
import type { CreateSenderSetting, SenderInfoResponse, SetSenderTextRequest } from '../types/sender';
import senderService from '../services/senderService';

const useSender = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const GetMyCompanySenderInfo = useCallback(async (): Promise<SenderInfoResponse | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await senderService.getMyCompanySenderInfo();
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const ToggleSenderActivity = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.ToggleSenderActivity();
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const ToggleShouldAutoBuy = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.ToggleShouldAutoBuy();
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const SetSenderTextPattern = useCallback(async (request: SetSenderTextRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.SetSenderTextPattern(request);
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const CreateNewSenderSetting = useCallback(async (request: CreateSenderSetting) => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.CreateSenderSetting(request);
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const DeleteSenderSetting = useCallback(async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.DeleteSenderSetting(id);
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const BuyMessages = useCallback(async (days: number) => {
        setIsLoading(true);
        setError(null);
        try {
            await senderService.BuyMessages(days);
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle');
            return;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        GetMyCompanySenderInfo,
        ToggleSenderActivity,
        ToggleShouldAutoBuy,
        SetSenderTextPattern,
        CreateNewSenderSetting,
        DeleteSenderSetting,
        BuyMessages
    };
};

export default useSender;