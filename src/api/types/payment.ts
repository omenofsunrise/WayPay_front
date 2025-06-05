import type { PaginationParams } from './common';

export interface Payment {
    id: number;
    creditId: number;
    paymentAmount: number;
    paymentDate: Date;
    type: 'cash' | 'card';
    accepted: boolean;
    clientFullName: string;
    investorNickname: string;
}

export interface PaymentParams extends PaginationParams {
    clientFullname?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface PaymentByCreditParams extends PaginationParams {
    creditId: number;
}

export interface CreatePaymentRequest {
    creditId: number;
    paymentAmount: number;
    datePayment: string;
    type: 'cash' | 'card';
}