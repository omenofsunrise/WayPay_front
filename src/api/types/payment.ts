import type { PaginatedResponse, PaginationParams } from './common';

export interface Payment {
    bankCardDetails: string;
    id: number;
    creditId: number;
    paymentAmount: number;
    paymentDate: Date;
    type: 'cash' | 'card';
    accepted: boolean;
    clientFullName: string;
    investorNickname: string;
    employeeFullName: string;
    income: number;
}

export interface PaymentParams extends PaginationParams {
    clientFullname?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    investorNickname?: string,
    dateFrom?: Date;
    dateTo?: Date;
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