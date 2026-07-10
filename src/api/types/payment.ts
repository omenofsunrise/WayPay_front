import type { PaginatedResponse, PaginationParams } from "./common";

export interface Payment {
  bankCardDetails: string;
  bankCardId: number;
  id: number;
  creditId: number;
  paymentAmount: number;
  paymentDate: Date;
  type: "cash" | "card" | "paymentPlace";
  accepted: boolean;
  clientFullName: string;
  investorNickname: string;
  employeeFullName: string;
  income: number;
}

export interface PaymentParams extends PaginationParams {
  clientFullname?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  investorNickname?: string;
  confirmed?: boolean;
  employeeFullname?: string;
  dateFrom?: Date;
  dateTo?: Date;
  poolId?: number;
  investorId?: number;
  paymentType?: "cash" | "card" | "paymentPlace";
  bankCardId?: number;
}

export interface PaymentByCreditParams extends PaginationParams {
  creditId: number;
}

export interface CreatePaymentRequest {
  creditId: number;
  paymentAmount: number;
  datePayment: string;
  type: "cash" | "card" | "paymentPlace";
}

// Ответ POST /Payment: платёж + признак последнего платежа по договору
// (isLast) и id клиента — для запуска окна отзыва о клиенте.
export interface CreatePaymentResponse extends Payment {
  isLast?: boolean;
  clientId?: number;
}

export interface PaymentResponse extends PaginatedResponse<Payment> {
  totalPayments: number;
  totalIncome: number;
}

export interface PaymentTab {
  contractNumber: string;
  contractDate: Date;

  clientName: string;
  clientAddress: string;
  clientPhone: string;

  paymentDate: Date;
  paymentAmount: number;
  paymentType: string;

  employeeFullname: string;
}
