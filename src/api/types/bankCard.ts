import { number } from "framer-motion";

export interface BankCard {
  id: number;
  details: string;
  balance: number;
  paymentsAmount: number;
}

export interface BankCardRequest {
  phone?: string;
  details?: string;
}

export interface BankCardFilters {
  page?: number;
  pageSize?: number;
  bankCardId?: number;
}

export interface Withdraw {
  id: number;

  createdAt: Date;

  amount: number;

  bankCardId: number;

  bankCard: BankCard;
}