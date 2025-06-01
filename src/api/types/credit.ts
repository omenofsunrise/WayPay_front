import type { PaginationParams } from './common';

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
    investorNickname?: string;
    clientFullname?: string;
    isFavourite?: boolean;
    isActive?: boolean;
}