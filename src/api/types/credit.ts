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
    phone: string;
    investorFullName: string;
}

export interface CreditParams extends PaginationParams {
    creditId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    dateFrom?: Date;
    dateTo?: Date;
    investorNick?: string;
    clientFullname?: string; 
}