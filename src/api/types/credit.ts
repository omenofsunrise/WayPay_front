import type { PaginationParams, PaginatedResponse } from './common';

export type GuarantorType = 'Guarantor' | 'Client';

export const NOTEABLE_TYPES = {
  CREDIT: 'Guarantor' as GuarantorType,
  CLIENT: 'Client' as GuarantorType,
};

export interface Credit {
    guarantorFullname?: string;
    guarantorPhone?: string;
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
    guarantorType?: GuarantorType;
    firstPayment: number;
    accured: number;
    payed: number;
    rest: number;
    currentMonthDebt: number;
    debt: number;
    incomeRubles: number;
    incomePercents: number;
    employeeName: string;
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
  paymentDay: number;
  nextMonthStart: boolean;
  products: Array<{
    name: string;
    price: number;
    surcharge?: number;
    surchargeAmount?: number;
  }>;
}

export interface CreditParams extends PaginationParams {
    creditId?: string;
    investorPoolId?: number;
    creditTypeId: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
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
}