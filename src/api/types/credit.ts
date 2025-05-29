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