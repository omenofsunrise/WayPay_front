import { useState, useCallback } from 'react';
import paymentService from '../services/paymentService';
import type { Payment, PaymentParams, CreatePaymentRequest, PaymentByCreditParams, PaymentTab, PaymentResponse } from '../types/payment';
import type { PaginatedResponse } from '../types/common';
import type { Credit } from '../types/credit';
import { formatDate } from '../../utils/dateFormatter';
import { formatMoney } from '../../utils/formatPrice';

const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentResponse | null>(null);

  const getPayments = useCallback(async (params?: PaymentParams): Promise<PaymentResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPayments(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentTab = useCallback(async (paymentId: number): Promise<PaymentTab | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentTab(paymentId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentsByCreditId = useCallback(async (params: PaymentByCreditParams): Promise<PaymentResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentsByCreditId(params);
      console.log(result);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (paymentData: CreatePaymentRequest): Promise<Payment | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await paymentService.createPayment(paymentData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentService.confirmPayment(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePaymentHistoryMessage = async (credit: Credit): Promise<string> => {
    try {
      const paginationParams = {
        page: 1,
        pageSize: 100,
        creditId: credit.id
      };
      
      const paymentHistory = await getPaymentsByCreditId(paginationParams);
      
      if (!paymentHistory?.items?.length) {
        return `История платежей по договору №${credit.id}\n\n` +
              `*Платежей не найдено.*\n\n`;
      }
      
      let message = `История платежей по договору №${credit.id}\n\n`;
      message += `------------------\n`;
      
      const sortedPayments = [...paymentHistory.items].sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
      
      sortedPayments.forEach((payment, index) => {
        const paymentDate = formatDate(payment.paymentDate);
        const paymentAmount = formatMoney(payment.paymentAmount.toString());
        const paymentType = payment.type === 'cash' ? 'Наличные' : 'Карта';
        const status = payment.accepted ? '✅ Принят' : '⏳ Ожидает';
        
        message += `${index + 1}. ${paymentDate}\n`;
        message += `   Сумма: ${paymentAmount}\n`;
        message += `   Способ: ${paymentType}\n`;
        if (payment.bankCardDetails) {
          message += `   Карта: ${payment.bankCardDetails}\n`;
        }
        if (payment.employeeFullName) {
          message += `   Сотрудник: ${payment.employeeFullName}\n`;
        }
        message += `------------------\n`;
      });
      
      message += `Количество платежей: ${paymentHistory.items.length}\n`;;
      
      return message;
      
    } catch (error) {
      console.error('Ошибка при загрузке истории платежей:', error);
      return `📋 *История платежей по договору №${credit.id}*\n\n` +
            `Произошла ошибка при загрузке данных.\n` +
            `Пожалуйста, обратитесь к администратору.\n\n` +
            `_Отправлено ${new Date().toLocaleDateString('ru-RU')}_`;
    }
  };

  return {
    isLoading,
    error,
    data,
    getPayments,
    getPaymentsByCreditId,
    createPayment,
    confirmPayment,
    deletePayment,
    getPaymentTab,
    generatePaymentHistoryMessage
  };
};

export default usePayment;