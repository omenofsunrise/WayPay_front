import { useCallback, useState } from "react";
import investorShareService from "../services/investorShareService";
import type {
  InvestorShareTokenResponse,
  InvestorSharedCreditsPage,
  InvestorSharedReportResponse,
} from "../types/investorShare";

const useInvestorShare = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShareLink = useCallback(
    async (
      investorId: number,
      minutes?: number
    ): Promise<InvestorShareTokenResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await investorShareService.createShareLink(investorId, minutes);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось создать ссылку"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSharedReport = useCallback(
    async (token: string): Promise<InvestorSharedReportResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await investorShareService.getSharedReport(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ссылка недействительна");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSharedCredits = useCallback(
    async (
      token: string,
      page: number,
      pageSize: number
    ): Promise<InvestorSharedCreditsPage | null> => {
      try {
        return await investorShareService.getSharedCredits(token, page, pageSize);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось загрузить договоры"
        );
        return null;
      }
    },
    []
  );

  return {
    createShareLink,
    getSharedReport,
    getSharedCredits,
    isLoading,
    error,
  };
};

export default useInvestorShare;
