import { useCallback, useState } from "react";
import whatsappSenderService from "../services/whatsappSenderService";
import type {
  WhatsAppSender,
  UpsertWhatsAppSenderRequest,
  SenderReport,
  SenderReportDetails,
  SenderReportDetailsParams,
} from "../types/whatsappSender";

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : "Unknown error";

const useWhatsAppSender = () => {
  const [senders, setSenders] = useState<WhatsAppSender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSenders = useCallback(async (): Promise<WhatsAppSender[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await whatsappSenderService.getSenders();
      setSenders(list);
      return list;
    } catch (err) {
      setError(errorMessage(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSender = useCallback(
    async (body: UpsertWhatsAppSenderRequest): Promise<boolean> => {
      try {
        await whatsappSenderService.createSender(body);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      }
    },
    []
  );

  const updateSender = useCallback(
    async (
      senderId: number,
      body: UpsertWhatsAppSenderRequest
    ): Promise<boolean> => {
      try {
        await whatsappSenderService.updateSender(senderId, body);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      }
    },
    []
  );

  const deleteSender = useCallback(
    async (senderId: number): Promise<boolean> => {
      try {
        await whatsappSenderService.deleteSender(senderId);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      }
    },
    []
  );

  const setSenderBots = useCallback(
    async (senderId: number, botIds: number[]): Promise<boolean> => {
      try {
        await whatsappSenderService.setSenderBots(senderId, botIds);
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      }
    },
    []
  );

  const getReport = useCallback(
    async (date?: string): Promise<SenderReport | null> => {
      try {
        return await whatsappSenderService.getReport(date);
      } catch (err) {
        setError(errorMessage(err));
        return null;
      }
    },
    []
  );

  const getReportDetails = useCallback(
    async (
      params: SenderReportDetailsParams
    ): Promise<SenderReportDetails | null> => {
      try {
        return await whatsappSenderService.getReportDetails(params);
      } catch (err) {
        setError(errorMessage(err));
        return null;
      }
    },
    []
  );

  return {
    senders,
    isLoading,
    error,
    loadSenders,
    createSender,
    updateSender,
    deleteSender,
    setSenderBots,
    getReport,
    getReportDetails,
  };
};

export default useWhatsAppSender;
