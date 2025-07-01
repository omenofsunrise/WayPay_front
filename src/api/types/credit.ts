import type { PaginationParams, PaginatedResponse } from './common';

export interface Credit {
    id: number;
    creditDate: Date;
    totalAmount: number;
    isActive: boolean;
    isFavourite: boolean;
    clientId: number;
    investorId: number;
    termMonths: number;
    clientFullName: string;
    clientPhone: string;
    investorNickname: string;
    guarantorId: number;
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
    guarantorId?: number;
    investorId: number;
    creditDate: Date;
    firstPayment: number;
    termMonths: number;
    paymentDay: number;
    products: Array<{
        name: string;
        price: number;
        surcharge: number;
    }>;
}

export interface CreditParams extends PaginationParams {
    creditId?: number;
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
}

export interface CreditDocs {
    city?: string;
    contractNumber?: number;
}

export interface CreditResponse extends PaginatedResponse<Credit> {
    totalAccured: number;
    totalDebt: number;
    totalPayed: number;
    totalRest: number;
    totalIncomeRubles: number;
}