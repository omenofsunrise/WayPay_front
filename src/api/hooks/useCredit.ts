import { useState, useCallback } from 'react';
import creditService from '../services/creditService';
import type { Credit, CreditParams, CreateCreditRequest, CreditResponse, CreditDocs } from '../types/credit';

const useCredit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreditResponse | null>(null);

  const getCredits = useCallback(async (params?: CreditParams): Promise<CreditResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.getCredits(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCredit = useCallback(async (creditData: CreateCreditRequest): Promise<Credit | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await creditService.createCredit(creditData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credit');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocsData = useCallback(async (id?: number): Promise<CreditDocs | null> => {
      setIsLoading(true);
      setError(null);
      try {
          // Моковые данные для тестирования
          const mockData: CreditDocs = {
              contractNumber: id?.toString() || '145',
              contractDate: new Date().toLocaleDateString(),

              clientName: "Иванов Иван Иванович",
              clientBirthdate: new Date('1990-05-15').toLocaleDateString(),
              clientAddress: "Чеченская Республика, г. Грозный, ул. Космонавтов, д. 1, кв. 1",
              passportSeries: "0319",
              passportNumber: "439578",
              docIssueDate: "31.12.2026",
              clientPhone: "8 (961)-501-21-13", 
              guarantorName: "Адлер Манис Эвглевич",

              city: "Москва",
              chief: "Элипханов Ибрагим",
              address: "364024, Чеченская Республика, г. Грозный, ул. Космонавтов, д.2, кв.2",
              checkingAccount: "787487312",
              email: "asdsasd@yandex.com",
              inn: "777477777",

              lastDay: "31.12.2026 г.",
              product: "Samsung Galaxy S12",
              
              termMonths: "13 (тринадцать)",
              totalAmount: "150 000 (сто пятьдесят тысяч)",
              cleanAmount: "120 000 (сто двадцать тысяч)",
              addAmount: "30 000 (тридцать тысяч)",
              firstPayment: "10 000 (десять тысяч)",
              restAmount: "140 000 (сто сорок тысяч)",
              
              paymentSchedule: [
                  {
                      date: "31.01.2024",
                      balance: "140 000",
                      payment: "10 000",
                      note: "Первый платеж"
                  },
                  {
                      date: "28.02.2024",
                      balance: "130 000",
                      payment: "10 000",
                      note: "Второй платеж"
                  },
                  {
                      date: "31.03.2024",
                      balance: "120 000",
                      payment: "10 000",
                      note: "Третий платеж"
                  },
                  {
                      date: "30.04.2024",
                      balance: "110 000",
                      payment: "10 000",
                      note: "4 платеж"
                  },
                  {
                      date: "31.05.2024",
                      balance: "100 000",
                      payment: "10 000",
                      note: "5 платеж"
                  },
                  {
                      date: "30.06.2024",
                      balance: "90 000",
                      payment: "10 000",
                      note: "6 платеж"
                  },
                  {
                      date: "31.07.2024",
                      balance: "80 000",
                      payment: "10 000",
                      note: "7 платеж"
                  },
                  {
                      date: "31.08.2024",
                      balance: "70 000",
                      payment: "10 000",
                      note: "8 платеж"
                  },
                  {
                      date: "30.09.2024",
                      balance: "60 000",
                      payment: "10 000",
                      note: "9 платеж"
                  },
                  {
                      date: "31.10.2024",
                      balance: "50 000",
                      payment: "10 000",
                      note: "9 платеж"
                  },
                  {
                      date: "30.11.2024",
                      balance: "40 000",
                      payment: "10 000",
                      note: "10 платеж"
                  },
                  {
                      date: "31.12.2024",
                      balance: "30 000",
                      payment: "10 000",
                      note: "12 платеж"
                  },
                  {
                      date: "31.01.2025",
                      balance: "20 000",
                      payment: "10 000",
                      note: "13 платеж"
                  }
            ]
        };
        
          return mockData;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          return null;
      } finally {
          setIsLoading(false);
      }
  }, []);

  const toggleFavourite = useCallback(async (id: number) => {
    try {
      await creditService.toggleCredit(id);
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(credit => 
            credit.id === id ? { ...credit, isFavourite: !credit.isFavourite } : credit
          )
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }, []);

  const deleteCredit = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await creditService.deleteCredit(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    data,
    getCredits,
    createCredit,
    toggleFavourite,
    deleteCredit,
    getDocsData
  };
};

export default useCredit;