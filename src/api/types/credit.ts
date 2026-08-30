import type { PaginationParams, PaginatedResponse } from "./common";
import type { ClientContact } from "./client";

export type GuarantorType = "Guarantor" | "Client";

export const NOTEABLE_TYPES = {
  CREDIT: "Guarantor" as GuarantorType,
  CLIENT: "Client" as GuarantorType,
};

export interface Credit {
  guarantorFullname?: string;
  guarantorPhone?: string;
  guarantorBirthdate?: string | Date;
  guarantorAddress?: string;
  id: number;
  name: string;
  creditTypeId: number;
  creditTypeName: string;
  creditDate: Date;
  totalAmount: number;
  totalClean: number;
  isActive: boolean;
  isFavourite: boolean;
  clientId: number;
  investorId?: number;
  poolId?: number;
  termMonths: number;
  clientFullName: string;
  clientPhone: string;
  investorNickname: string;
  guarantorId?: number;
  guarantorClientId?: number;
  guarantorType?: GuarantorType;
  guarantor?: {
    fullName?: string;
    phone?: string;
    birthdate?: string | Date;
    address?: string;
    doc?: string;
  };
  firstPayment: number;
  accured: number;
  payed: number;
  rest: number;
  currentMonthDebt: number;
  debtComment?: string;
  debt: number;
  incomeRubles: number;
  incomePercents: number;
  employeeName: string;
  debtDays?: number;
  defferedIncome?: number;
  investorPieInPool?: number;
  clientContacts?: ClientContact[];
  terminated: boolean;
  hasCounterApproved?: boolean;
}

export interface CreateCreditRequest {
  clientId: number;
  name: string;
  creditTypeId: number;

  GuarantorClientId: number;
  guarantor?: {
    fullName: string;
    phone: string;
    birthdate?: Date;
    address?: string;
    doc?: string;
  };

  investorId?: number;
  poolId?: number;
  creditDate: Date;
  firstPayment: number;
  termMonths: number;
  startPaymentDay: Date;
  turnOfRounding: boolean;
  inDebt: boolean;
  debtComment?: string;
  products: Array<{
    name: string;
    price: number;
    surcharge?: number;
    surchargeAmount?: number;
  }>;
}

export interface UpdateCreditRequest extends CreateCreditRequest {
  id: number;
}

export interface CreditParams extends PaginationParams {
  creditId?: string;
  investorPoolId?: number;
  creditTypeId?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  dateFrom?: Date;
  dateTo?: Date;
  rublesIncomeFrom?: number;
  rublesIncomeTo?: number;
  percentsIncomeFrom?: number;
  percentsIncomeTo?: number;
  investorNickname?: string;
  clientFullname?: string;
  isFavourite?: boolean;
  isActive?: boolean;
  clientId?: number;
  includeAllStates?: boolean;
  Terminated?: boolean;
  clientAddress?: string;
}

export interface CreditDocs {
  contractNumber?: string;
  contractDate?: string;

  clientName?: string;
  clientBirthdate?: string;
  passportSeries?: string;
  passportNumber?: string;
  docIssueDate?: string;
  clientPhone?: string;
  clientAddress?: string;

  guarantorName?: string;
  guarantorBirthdate?: string;
  guarantorPassportSeries?: string;
  guarantorPassportNumber?: string;
  guarantorDocIssueDate?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;

  city?: string;
  chief?: string;
  address?: string;
  checkingAccount?: string;
  email?: string;
  inn?: string;

  lastDay?: string;
  termMonths?: string;
  totalAmount?: string;
  cleanAmount?: string;
  addAmount?: string;
  firstPayment?: string;
  restAmount?: string;
  product?: string;

  soldProducts?: SoldProductItem[];
  paymentSchedule?: PaymentScheduleItem[];

  [key: string]: any;
}

export interface PaymentScheduleItem {
  date: string;
  balance: string;
  payment: string;
  note?: string;
}

export interface SoldProductItem {
  name: string;
  price: string;
  surcharge?: string;
  surchargeAmount?: string;
  totalAmount: string;
}

export interface CreditResponse extends PaginatedResponse<Credit> {
  totalAccured: number;
  totalDebt: number;
  totalPayed: number;
  totalRest: number;
  totalIncomeRubles: number;
  totalPrice: number;
  totalFirstPayment: number;
}

export type InvestmentSourceType = 1 | 2;

export const InvestmentSourceType = {
  Investor: 1 as InvestmentSourceType,
  InvestorPool: 2 as InvestmentSourceType,
} as const;

export interface SetInvestmentSourceRequest {
  sourceType: InvestmentSourceType;
  entityId: number;
}

export interface CreditListResponse {
  id: number;
  status: string;
  creditDate: Date;
}
